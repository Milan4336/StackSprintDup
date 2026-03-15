import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L, { divIcon } from 'leaflet';
import 'leaflet.heat';
import 'leaflet.markercluster';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useThreatStore } from '../../store/threatStore';
import { Transaction } from '../../types';
import { formatSafeDate, safeDate } from '../../utils/date';
import { GeoTrajectoryOverlay } from '../visual/GeoTrajectoryOverlay';

interface FraudRadarMapProps {
  transactions: Transaction[];
  heightClass?: string;
}

type TimePreset = '10m' | '1h' | '24h' | 'custom';
type DeviceBadge = 'trusted' | 'new' | 'high';

interface DeviceMeta {
  isNewDevice: boolean;
  deviceRiskScore: number;
  previousLocation: string;
  previousTime: string;
  badge: DeviceBadge;
}

interface RadarPoint {
  tx: Transaction;
  coords: [number, number];
  meta: DeviceMeta;
}

interface GeoPath {
  id: string;
  from: [number, number];
  to: [number, number];
  userId: string;
  distanceKm: number;
  hoursDiff: number;
  tx: Transaction;
}

const locationMap: Record<string, [number, number]> = {
  ny: [40.7128, -74.006], newyork: [40.7128, -74.006],
  ca: [36.7783, -119.4179], california: [36.7783, -119.4179],
  tx: [31.9686, -99.9018], texas: [31.9686, -99.9018],
  fl: [27.6648, -81.5158], florida: [27.6648, -81.5158],
  wa: [47.7511, -120.7401], washington: [47.7511, -120.7401],
  london: [51.5072, -0.1276],
  paris: [48.8566, 2.3522],
  berlin: [52.5200, 13.4050],
  dubai: [25.2048, 55.2708],
  tokyo: [35.6762, 139.6503],
  sydney: [-33.8688, 151.2093],
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  singapore: [1.3521, 103.8198],
  hongkong: [22.3193, 114.1694],
  toronto: [43.6532, -79.3832],
  london_uk: [51.5072, -0.1276],
  uk: [51.5072, -0.1276],
  us: [37.0902, -95.7129],
  in: [20.5937, 78.9629],
  fr: [46.2276, 2.2137],
  de: [51.1657, 10.4515],
  jp: [36.2048, 138.2529]
};

const normalizeLocation = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '');

const isValidCoordinates = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const toLocalDateTimeValue = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const haversineKm = (from: [number, number], to: [number, number]): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const earthRadius = 6371;

  const dLat = toRad(to[0] - from[0]);
  const dLon = toRad(to[1] - from[1]);
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const coordsForTransaction = (tx: Transaction): [number, number] | null => {
  if (
    typeof tx.latitude === 'number' &&
    typeof tx.longitude === 'number' &&
    isValidCoordinates(tx.latitude, tx.longitude)
  ) {
    return [tx.latitude, tx.longitude];
  }

  const mapped = locationMap[normalizeLocation(tx.location)];
  return mapped ?? null;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

const badgeLabel = (badge: DeviceBadge): string => {
  if (badge === 'high') return '🔴 High-Risk Device';
  if (badge === 'new') return '🟡 New Device';
  return '🟢 Trusted Device';
};

const buildPopupHtml = (point: RadarPoint): string => {
  const { tx, meta } = point;
  const cityCountry = [tx.city, tx.country].filter(Boolean).join(', ') || tx.location;
  const warning = tx.geoVelocityFlag
    ? '<p class="radar-warning">Suspicious Geo Jump Detected</p>'
    : '';

  return `
    <div class="radar-popup">
      <p class="radar-popup-title">${escapeHtml(tx.transactionId)}</p>
      <p>User: ${escapeHtml(tx.userId)}</p>
      <p>Geo: ${escapeHtml(cityCountry)}</p>
      <p>Amount: $${tx.amount.toLocaleString()}</p>
      <p>Fraud Score: ${tx.fraudScore} (${escapeHtml(tx.riskLevel)})</p>
      <p>Action: ${escapeHtml(tx.action ?? 'N/A')}</p>
      ${warning}
      <hr />
      <p><strong>Device ID:</strong> ${escapeHtml(tx.deviceId)}</p>
      <p><strong>Device Status:</strong> ${badgeLabel(meta.badge)}</p>
      <p><strong>New Device:</strong> ${meta.isNewDevice ? 'Yes' : 'No'}</p>
      <p><strong>Device Risk Score:</strong> ${meta.deviceRiskScore}</p>
      <p><strong>Previous Location:</strong> ${escapeHtml(meta.previousLocation)}</p>
      <p><strong>Last Transaction:</strong> ${escapeHtml(meta.previousTime)}</p>
      <p><strong>TX Time:</strong> ${escapeHtml(formatSafeDate(tx.timestamp))}</p>
    </div>
  `;
};

const markerIconFor = (score: number, incidentMode: boolean, isSpiking: boolean): L.DivIcon => {
  const level = score > 70 ? 'high' : score > 40 ? 'medium' : 'low';
  const pulseClass = score > 70 ? 'radar-marker-pulse' : '';
  const incidentClass = (incidentMode && score > 70) || isSpiking ? 'radar-marker-critical' : '';
  const glowClass = isSpiking ? 'radar-marker-glow-red' : '';

  return divIcon({
    html: `
      <span class="radar-node ${pulseClass} ${incidentClass} ${glowClass}">
        <span class="radar-node-core radar-node-${level}"></span>
        <span class="radar-node-ripple"></span>
      </span>
    `,
    className: 'radar-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const arrowIcon = divIcon({
  html: '<span class="radar-jump-arrow">➤</span>',
  className: 'radar-arrow-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

interface MapLayersProps {
  points: RadarPoint[];
  paths: GeoPath[];
  showHeatmap: boolean;
  showMarkers: boolean;
  showPaths: boolean;
  incidentMode: boolean;
}

const MapLayers = ({
  points,
  paths,
  showHeatmap,
  showMarkers,
  showPaths,
  incidentMode
}: MapLayersProps) => {

  const map = useMap();

  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterRef = useRef<any>(null);
  const heatRef = useRef<any>(null);
  const pathsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {

    if (!clusterRef.current) {
      clusterRef.current = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 52
      });

      map.addLayer(clusterRef.current);
    }

    if (!pathsRef.current) {
      pathsRef.current = L.layerGroup();
      map.addLayer(pathsRef.current);
    }

    if (showMarkers) {

      for (const point of points) {

        if (markersRef.current.has(point.tx.transactionId)) continue;

        const marker = L.marker(point.coords, {
          icon: markerIconFor(point.tx.fraudScore, incidentMode, (point as any).isSpiking)
        });

        marker.bindPopup(buildPopupHtml(point));

        clusterRef.current.addLayer(marker);

        markersRef.current.set(point.tx.transactionId, marker);
      }

      if (markersRef.current.size > 300) {

        const excess = markersRef.current.size - 300;

        const keys = Array.from(markersRef.current.keys()).slice(0, excess);

        for (const key of keys) {
          const marker = markersRef.current.get(key);
          if (marker) {
            clusterRef.current.removeLayer(marker);
            markersRef.current.delete(key);
          }
        }
      }

    }

    if (showHeatmap) {

      const heatData = points.map(p => [
        p.coords[0],
        p.coords[1],
        Math.max(0.1, Math.min(1, p.tx.fraudScore / 100))
      ]);

      if (!heatRef.current) {
        heatRef.current = (L as any).heatLayer(heatData, {
          radius: 26,
          blur: 18,
          minOpacity: 0.4
        });
        map.addLayer(heatRef.current);
      } else {
        heatRef.current.setLatLngs(heatData);
      }

    }

    if (showPaths) {

      pathsRef.current.clearLayers();

      for (const path of paths.slice(-100)) {

        const polyline = L.polyline([path.from, path.to], {
          color: '#ef4444',
          weight: 3,
          opacity: 0.75,
          dashArray: '9 12'
        });

        pathsRef.current.addLayer(polyline);
      }

    }

  }, [points, paths, showMarkers, showHeatmap, showPaths, incidentMode, map]);

  return null;
};

export const FraudRadarMap = memo(({ transactions, heightClass = 'h-[500px]' }: FraudRadarMapProps) => {
  const deferredTransactions = useDeferredValue(transactions);
  const incidentMode = useThreatStore((state) => state.threatLevel === 'CRITICAL');

  const [timePreset, setTimePreset] = useState<TimePreset>('1h');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [customStart, setCustomStart] = useState(() => toLocalDateTimeValue(new Date(Date.now() - 60 * 60 * 1000)));
  const [customEnd, setCustomEnd] = useState(() => toLocalDateTimeValue(new Date()));

  const filteredTransactions = useMemo(() => {
    const now = Date.now();

    let fromMs = 0;
    let toMs = now;

    if (timePreset === '10m') {
      fromMs = now - 10 * 60 * 1000;
    } else if (timePreset === '1h') {
      fromMs = now - 60 * 60 * 1000;
    } else if (timePreset === '24h') {
      fromMs = now - 24 * 60 * 60 * 1000;
    } else {
      fromMs = safeDate(customStart)?.getTime() ?? now - 24 * 60 * 60 * 1000;
      toMs = safeDate(customEnd)?.getTime() ?? now;
    }

    return deferredTransactions
      .filter((tx) => {
        const ts = safeDate(tx.timestamp)?.getTime();
        if (!ts) return false;
        return ts >= fromMs && ts <= toMs;
      })
      .sort((a, b) => (safeDate(a.timestamp)?.getTime() ?? 0) - (safeDate(b.timestamp)?.getTime() ?? 0));
  }, [deferredTransactions, timePreset, customEnd, customStart]);

  const { points, paths, highRiskCount, fraudDensityScore, mostTargetedCountry, activeSpikes } = useMemo(() => {
    const userState = new Map<string, { seenDevices: Set<string>; previous?: Transaction }>();
    const pointsBuffer: RadarPoint[] = [];

    for (const tx of filteredTransactions) {
      const coords = coordsForTransaction(tx);
      if (!coords) continue;

      const state = userState.get(tx.userId) ?? { seenDevices: new Set<string>(), previous: undefined };
      const isNewDevice = !state.seenDevices.has(tx.deviceId);
      const previousLocation = state.previous?.location ?? 'N/A';
      const previousTime = state.previous ? formatSafeDate(state.previous.timestamp) : 'N/A';

      const deviceRiskScore = Math.min(
        100,
        Math.round(tx.fraudScore + (isNewDevice ? 15 : 0) + (tx.geoVelocityFlag ? 20 : 0) + (tx.isFraud ? 10 : 0))
      );

      const badge: DeviceBadge = deviceRiskScore >= 75 ? 'high' : isNewDevice ? 'new' : 'trusted';

      pointsBuffer.push({
        tx,
        coords,
        meta: {
          isNewDevice,
          deviceRiskScore,
          previousLocation,
          previousTime,
          badge
        }
      });

      state.seenDevices.add(tx.deviceId);
      state.previous = tx;
      userState.set(tx.userId, state);
    }

    const groupedByUser = new Map<string, RadarPoint[]>();
    for (const point of pointsBuffer) {
      const arr = groupedByUser.get(point.tx.userId) ?? [];
      arr.push(point);
      groupedByUser.set(point.tx.userId, arr);
    }

    const suspiciousPaths: GeoPath[] = [];
    for (const [userId, userPoints] of groupedByUser.entries()) {
      userPoints.sort((a, b) => (safeDate(a.tx.timestamp)?.getTime() ?? 0) - (safeDate(b.tx.timestamp)?.getTime() ?? 0));
      for (let i = 1; i < userPoints.length; i += 1) {
        const prev = userPoints[i - 1];
        const curr = userPoints[i];

        const prevTs = safeDate(prev.tx.timestamp)?.getTime();
        const currTs = safeDate(curr.tx.timestamp)?.getTime();
        if (!prevTs || !currTs) continue;

        const distanceKm = haversineKm(prev.coords, curr.coords);
        const hoursDiff = Math.abs(currTs - prevTs) / (1000 * 60 * 60);

        if (distanceKm > 1500 && hoursDiff < 2) {
          suspiciousPaths.push({
            id: `${userId}-${prev.tx.transactionId}-${curr.tx.transactionId}`,
            from: prev.coords,
            to: curr.coords,
            userId,
            distanceKm,
            hoursDiff,
            tx: curr.tx
          });
        }
      }
    }

    const cityRiskCount = new Map<string, number>();
    const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
    
    for (const p of pointsBuffer) {
      const ts = safeDate(p.tx.timestamp)?.getTime() || 0;
      if (ts > fifteenMinAgo && p.tx.fraudScore > 80) {
        const city = p.tx.city || p.tx.location || 'Unknown';
        cityRiskCount.set(city, (cityRiskCount.get(city) ?? 0) + 1);
      }
    }

    const spikingCities = new Set<string>();
    for (const [city, count] of cityRiskCount.entries()) {
      if (count >= 3) spikingCities.add(city);
    }

    const highRiskCountValue = pointsBuffer.filter((p) => p.tx.fraudScore > 70 || p.tx.riskLevel === 'High').length;
    const fraudDensityValue = pointsBuffer.length ? Math.round((highRiskCountValue / pointsBuffer.length) * 100) : 0;

    const countryCounts = new Map<string, number>();
    for (const point of pointsBuffer) {
      const country = point.tx.country || 'Unknown';
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    }

    const mostTargeted = Array.from(countryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    return {
      points: pointsBuffer.map(p => ({
        ...p,
        isSpiking: spikingCities.has(p.tx.city || p.tx.location || 'Unknown')
      })),
      paths: suspiciousPaths,
      highRiskCount: highRiskCountValue,
      fraudDensityScore: fraudDensityValue,
      mostTargetedCountry: mostTargeted,
      activeSpikes: Array.from(spikingCities)
    };
  }, [filteredTransactions]);

  return (
    <motion.article className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="panel-title mb-0">Fraud Intelligence GeoMap</h3>
        <div className="flex flex-wrap items-center gap-2">
          {incidentMode ? (
            <span className="chip border-red-500/35 bg-red-500/10 text-red-200">Incident Mode</span>
          ) : null}
          <button type="button" className={`glass-btn ${showMarkers ? 'ring-1 ring-blue-400/40' : ''}`} onClick={() => setShowMarkers((p) => !p)}>
            {showMarkers ? 'Hide Markers' : 'Show Markers'}
          </button>
          <button type="button" className={`glass-btn ${showHeatmap ? 'ring-1 ring-blue-400/40' : ''}`} onClick={() => setShowHeatmap((p) => !p)}>
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </button>
          <button type="button" className={`glass-btn ${showPaths ? 'ring-1 ring-blue-400/40' : ''}`} onClick={() => setShowPaths((p) => !p)}>
            {showPaths ? 'Hide Paths' : 'Show Paths'}
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className={`glass-btn ${timePreset === '10m' ? 'ring-1 ring-blue-400/40' : ''}`} onClick={() => setTimePreset('10m')}>
          Last 10 min
        </button>
        <button type="button" className={`glass-btn ${timePreset === '1h' ? 'ring-1 ring-blue-400/40' : ''}`} onClick={() => setTimePreset('1h')}>
          Last 1 hour
        </button>
        <button type="button" className={`glass-btn ${timePreset === '24h' ? 'ring-1 ring-blue-400/40' : ''}`} onClick={() => setTimePreset('24h')}>
          Last 24 hours
        </button>
        <button type="button" className={`glass-btn ${timePreset === 'custom' ? 'ring-1 ring-blue-400/40' : ''}`} onClick={() => setTimePreset('custom')}>
          Custom Range
        </button>
      </div>

      {timePreset === 'custom' ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-slate-300">
            Start
            <input
              type="datetime-local"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="input mt-1"
            />
          </label>
          <label className="text-xs text-slate-300">
            End
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="input mt-1"
            />
          </label>
        </div>
      ) : null}

      {points.length === 0 ? (
        <p className="mb-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-400">
          No geo-resolved transactions in the selected time range.
        </p>
      ) : null}

      <div className={`relative overflow-hidden rounded-xl border border-slate-700 ${heightClass}`}>
        <div className="absolute right-3 top-3 z-[500] w-64 rounded-xl border border-slate-600/70 bg-slate-900/75 p-3 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Global Intelligence</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-slate-200">Total TX: <span className="font-semibold">{points.length}</span></p>
            <p className="text-slate-200">High Risk: <span className="font-semibold text-red-300">{highRiskCount}</span></p>
            <p className="text-slate-200">Fraud Density: <span className="font-semibold text-amber-300">{fraudDensityScore}%</span></p>
            <p className="text-slate-200">Top Country: <span className="font-semibold text-blue-300">{mostTargetedCountry}</span></p>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 z-[500] rounded-xl border border-slate-600/70 bg-slate-900/75 p-3 text-xs text-slate-300 backdrop-blur">
          <p className="mb-1 font-semibold uppercase tracking-[0.12em]">Fraud Intensity</p>
          <div className="flex items-center gap-2"><span className="h-2.5 w-6 rounded bg-yellow-300" /> Low</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-6 rounded bg-orange-400" /> Medium</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-6 rounded bg-red-500" /> High</div>
        </div>

        {activeSpikes.length > 0 && (
          <div className="absolute bottom-20 left-1/2 z-[1000] -translate-x-1/2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="px-6 py-2 rounded-full bg-red-600/20 border border-red-500/50 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
            >
              <span className="text-red-100 font-bold tracking-widest uppercase text-xs">
                ⚠️ CRITICAL REGIONAL PULSE: {activeSpikes.join(', ')} ⚠️
              </span>
            </motion.div>
          </div>
        )}

        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapLayers
            points={points}
            paths={paths}
            showHeatmap={showHeatmap}
            showMarkers={showMarkers}
            showPaths={showPaths}
            incidentMode={incidentMode}
          />
          {showPaths && (
            <GeoTrajectoryOverlay
              trajectories={paths.map(p => ({
                from: p.from,
                to: p.to,
                risk: (p.tx.fraudScore || 0) / 100
              }))}
            />
          )}
        </MapContainer>
      </div>
    </motion.article>
  );
});
