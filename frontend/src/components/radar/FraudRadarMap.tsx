import React, { memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Transaction } from '../../types';

// Fix Leaflet icon issues
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const FraudIcon = L.divIcon({
    className: 'fraud-marker',
    html: `
        <div class="relative flex items-center justify-center">
            <div class="absolute h-6 w-6 animate-ping rounded-full bg-red-500 opacity-75"></div>
            <div class="relative h-4 w-4 rounded-full bg-red-600 border-2 border-white shadow-lg"></div>
        </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const NormalIcon = L.divIcon({
    className: 'normal-marker',
    html: `<div class="h-2 w-2 rounded-full bg-cyan-500 border border-white opacity-60"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4]
});

interface FraudRadarMapProps {
    transactions: Transaction[];
}

const MapController = () => {
    const map = useMap();
    React.useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100);
    }, [map]);
    return null;
};

export const FraudRadarMap = memo(({ transactions }: FraudRadarMapProps) => {
    return (
        <div className="h-full w-full relative">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapController />
                {transactions.slice(0, 50).map((tx) => {
                    // Fallback coordinates if missing
                    const lat = tx.lat || (Math.random() * 120 - 60);
                    const lng = tx.lng || (Math.random() * 240 - 120);

                    return (
                        <Marker 
                            key={tx.transactionId} 
                            position={[lat, lng]} 
                            icon={tx.isFraud ? FraudIcon : NormalIcon}
                        >
                            <Popup className="theme-popup">
                                <div className="p-2">
                                    <p className="font-black text-xs uppercase tracking-tighter">
                                        TX: {tx.transactionId}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                        RISK: <span className={tx.isFraud ? 'text-red-500' : 'text-cyan-500'}>
                                            {tx.riskLevel}
                                        </span>
                                    </p>
                                    <p className="text-[10px] font-mono mt-1">${tx.amount.toLocaleString()}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            
            <div className="absolute top-4 right-4 z-[1000] p-3 rounded-xl glass-panel text-[10px] font-black uppercase tracking-widest text-white/60">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Live Fraud Cluster</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-500" />
                    <span>Standard Node</span>
                </div>
            </div>
        </div>
    );
});
