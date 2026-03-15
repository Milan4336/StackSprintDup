import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, MousePointer2, Target, Monitor, User } from 'lucide-react';
import { apiClient } from '../../api/client';

interface ForensicEvent {
    type: 'MOUSE_MOVE' | 'CLICK' | 'HOVER' | 'SCROLL' | 'INPUT';
    x: number;
    y: number;
    target?: string;
    timestamp: number;
}

interface SessionReplay {
    sessionId: string;
    userId: string;
    events: ForensicEvent[];
    duration: number;
    metadata: any;
}

export const ForensicReplay: React.FC<{ sessionId: string; onClose: () => void }> = ({ sessionId, onClose }) => {
    const [replay, setReplay] = useState<SessionReplay | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        const fetchReplay = async () => {
            try {
                const response = await apiClient.get(`/forensics/replay/${sessionId}`);
                setReplay(response.data);
            } catch (err) {
                console.error("Failed to load forensics replay", err);
            }
        };
        fetchReplay();
    }, [sessionId]);

    useEffect(() => {
        if (isPlaying && replay) {
            timerRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    if (prev >= replay.duration) {
                        setIsPlaying(false);
                        return replay.duration;
                    }
                    return prev + (0.1 * playbackSpeed);
                });
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, replay, playbackSpeed]);

    const currentEvents = replay?.events.filter(e => {
        const relativeTime = (e.timestamp - replay.events[0].timestamp) / 1000;
        return relativeTime <= currentTime && relativeTime > currentTime - 0.5;
    }) || [];

    const lastEvent = currentEvents[currentEvents.length - 1];

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-3xl p-8 flex flex-col gap-6"
        >
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Forensic <span className="text-red-500">Replay</span></h2>
                    <p className="text-[10px] font-mono text-red-400 opacity-60">SESSION_ID: {sessionId} // ENCRYPTED_STREAM</p>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors uppercase text-xs font-black tracking-widest">Close View</button>
            </header>

            <div className="flex-1 relative bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center">
                {/* Virtual Viewport */}
                <div className="relative w-[1280px] h-[720px] bg-slate-800/20 border border-white/10 rounded-xl shadow-2xl scale-[0.6] origin-center">
                    {/* Event Visualization */}
                    <AnimatePresence>
                        {currentEvents.map((event, i) => (
                            <motion.div
                                key={`${event.timestamp}-${i}`}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute pointer-events-none"
                                style={{ left: event.x, top: event.y }}
                            >
                                {event.type === 'CLICK' ? (
                                    <div className="h-10 w-10 -ml-5 -mt-5 border-4 border-red-500 rounded-full animate-ping" />
                                ) : (
                                    <div className="h-2 w-2 -ml-1 -mt-1 bg-cyan-400 rounded-full blur-[1px]" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Virtual Cursor */}
                    {lastEvent && (
                        <motion.div 
                            animate={{ x: lastEvent.x, y: lastEvent.y }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            className="absolute pointer-events-none z-50"
                        >
                            <MousePointer2 className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" size={24} />
                            {lastEvent.target && (
                                <div className="absolute left-6 top-6 bg-black/80 text-[10px] font-mono px-2 py-1 rounded border border-white/20 text-cyan-400">
                                    TARGET: {lastEvent.target}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* HUD Overlays in Virtual Viewport */}
                    <div className="absolute top-10 left-10 text-white/20 font-mono text-[14px]">
                        REC_TIME: {currentTime.toFixed(2)}s / {(replay?.duration ?? 0).toFixed(2)}s
                    </div>
                </div>

                {/* Scrubber HUD */}
                <div className="absolute bottom-8 left-8 right-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"
                        >
                            {isPlaying ? <Pause /> : <Play className="ml-1" />}
                        </button>
                        <button onClick={() => setCurrentTime(0)} className="text-white/60 hover:text-white"><RotateCcw size={20} /></button>
                        
                        <div className="flex-1 relative h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                className="absolute h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                style={{ width: `${(currentTime / (replay?.duration || 1)) * 100}%` }}
                            />
                            <input 
                                type="range" 
                                min={0} 
                                max={replay?.duration || 0} 
                                step={0.1}
                                value={currentTime}
                                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>

                        <div className="flex gap-2">
                            {[1, 2, 4].map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => setPlaybackSpeed(s)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-black ${playbackSpeed === s ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40'}`}
                                >
                                    {s}X
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-white/40">
                                <Monitor size={12} /> {replay?.metadata.browser}
                            </div>
                            <div className="flex items-center gap-2 text-white/40">
                                <User size={12} /> {replay?.userId}
                            </div>
                        </div>
                        <div className="text-red-400 font-bold uppercase tracking-widest animate-pulse">
                            Analyst Review Mode: Forensic_Timeline_Sync
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
