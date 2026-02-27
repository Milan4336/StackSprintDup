import { useEffect, useState } from 'react';
import { useGeoSlice } from '../store/slices/geoSlice';
import { Map, Plane, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const GeoAnalytics = () => {
    const { connectLive, disconnectLive } = useGeoSlice();

    // Dummy state until backend is fully hooked up
    const [jumps, setJumps] = useState(12);

    useEffect(() => {
        connectLive();

        const sim = setInterval(() => {
            setJumps(prev => prev + (Math.random() > 0.7 ? 1 : 0));
        }, 8000);

        return () => {
            clearInterval(sim);
            disconnectLive();
        };
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Geo Analytics</h1>
                <p className="text-sm font-bold text-slate-400 mt-1">Global origin heatmaps, impossible travel detection, and regional risk.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-red-500/20 bg-slate-900/50 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Impossible Travel Jumps</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white">{jumps}</span>
                            <span className="text-sm font-bold text-red-400 mb-1">Last 24h</span>
                        </div>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <Plane className="text-red-500" size={32} />
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 rounded-2xl border border-blue-500/20 bg-slate-900/50 p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Top High-Risk Regions</h3>
                    <div className="space-y-4 mt-4">
                        {['Eastern Europe', 'Southeast Asia', 'South America'].map((region, i) => (
                            <div key={region}>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-200">{region}</span>
                                    <span className="text-slate-400">{90 - (i * 15)}% Risk</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${90 - (i * 15)}%` }}
                                        transition={{ delay: i * 0.1 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[500px] rounded-2xl border border-slate-800 bg-slate-900/50 p-1 flex items-center justify-center relative overflow-hidden">
                <Map className="absolute opacity-5" size={400} />
                <span className="text-sm font-black uppercase tracking-widest text-slate-500 relative z-10">Leaflet Live Heatmap Rendering...</span>
            </div>
        </div>
    );
};
