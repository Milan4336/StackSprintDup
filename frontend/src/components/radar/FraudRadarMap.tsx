import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Transaction } from '../../types';

interface FraudRadarMapProps {
  transactions: Transaction[];
}

const locationMap: Record<string, [number, number]> = {
  ny: [40.7128, -74.006],
  newyork: [40.7128, -74.006],
  ca: [36.7783, -119.4179],
  california: [36.7783, -119.4179],
  tx: [31.9686, -99.9018],
  texas: [31.9686, -99.9018],
  fl: [27.6648, -81.5158],
  florida: [27.6648, -81.5158],
  wa: [47.7511, -120.7401],
  washington: [47.7511, -120.7401],
  london: [51.5072, -0.1276],
  delhi: [28.6139, 77.209],
  tokyo: [35.6762, 139.6503],
  dubai: [25.2048, 55.2708],
  sydney: [-33.8688, 151.2093]
};

const normalizeLocation = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '');

const isValidCoordinates = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const fraudIcon = divIcon({
  html: '<span class="radar-marker-dot radar-marker-fraud"></span>',
  className: 'radar-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const legitIcon = divIcon({
  html: '<span class="radar-marker-dot radar-marker-safe"></span>',
  className: 'radar-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const coordinatesForTransaction = (tx: Transaction): [number, number] | null => {
  if (
    typeof tx.latitude === 'number' &&
    typeof tx.longitude === 'number' &&
    isValidCoordinates(tx.latitude, tx.longitude)
  ) {
    return [tx.latitude, tx.longitude];
  }

  const mapped = locationMap[normalizeLocation(tx.location)];
  if (!mapped) return null;
  return mapped;
};

export const FraudRadarMap = memo(({ transactions }: FraudRadarMapProps) => {
  const points = useMemo(() => {
    const mapped = transactions.slice(0, 140).map((tx) => {
      const coords = coordinatesForTransaction(tx);
      if (!coords) return null;
      return { tx, coords };
    });
    return mapped.filter((item): item is { tx: Transaction; coords: [number, number] } => item !== null);
  }, [transactions]);

  return (
    <motion.article
      className="panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h3 className="panel-title">Real-Time Fraud Radar World Map</h3>
      {points.length === 0 ? (
        <p className="mb-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-400">
          No geo-mapped transactions yet. Create or simulate transactions.
        </p>
      ) : null}
      <div className="h-96 overflow-hidden rounded-xl border border-slate-700">
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {points.map(({ tx, coords }) => {
            const isFraud = tx.isFraud || tx.riskLevel === 'High';
            return (
              <Marker key={tx.transactionId} position={coords} icon={isFraud ? fraudIcon : legitIcon}>
                <Popup>
                  <div className="text-xs text-slate-900">
                    <p className="font-bold">{tx.transactionId}</p>
                    <p>User: {tx.userId}</p>
                    <p>Location: {tx.location}</p>
                    <p>Amount: ${tx.amount.toLocaleString()}</p>
                    <p>
                      Risk: {tx.riskLevel} ({tx.fraudScore})
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </motion.article>
  );
});
