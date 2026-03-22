import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint, Smartphone, CheckCircle2, AlertCircle, X, Loader2, Cpu } from 'lucide-react';
import axios from 'axios';
import { apiClient } from '../../api/client';

interface ZeroTrustModalProps {
    transactionId: string;
    amount: number;
    onSuccess: () => void;
    onClose: () => void;
}

type Step = 'OTP' | 'BIOMETRIC' | 'DEVICE' | 'SUCCESS';

export const ZeroTrustModal: React.FC<ZeroTrustModalProps> = ({ transactionId, amount, onSuccess, onClose }) => {
    const [currentStep, setCurrentStep] = useState<Step>('OTP');
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [verifiedOtp, setVerifiedOtp] = useState<string | null>(null);
    const [verifiedBiometric, setVerifiedBiometric] = useState<string | null>(null);

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length < 6) {
            setError('VALIDATION_ERROR: INVALID_CREDENTIALS');
            return;
        }
        setError(null);
        setIsLoading(true);
        setTimeout(() => {
            setVerifiedOtp(otpCode);
            setIsLoading(false);
            setCurrentStep('BIOMETRIC');
        }, 1200);
    };

    const handleBiometricAuth = () => {
        setError(null);
        setIsLoading(true);
        setTimeout(() => {
            setVerifiedBiometric('bio-token-' + Math.random().toString(36).substr(2, 9));
            setIsLoading(false);
            setCurrentStep('DEVICE');
        }, 2000);
    };

    const handleDeviceVerification = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const deviceToken = 'dev-attestation-' + Math.random().toString(36).substr(2, 9);

            await apiClient.post(`/transactions/${transactionId}/verify`, {
                otpCode: verifiedOtp,
                biometricToken: verifiedBiometric,
                deviceToken
            });

            setIsLoading(false);
            setCurrentStep('SUCCESS');
            setTimeout(() => onSuccess(), 2500);

        } catch (err) {
            setIsLoading(false);
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || 'HANDSHAKE_FAILURE: SERVER_REJECTED_ATTESTATION');
            } else {
                setError('SYSTEM_CRITICAL: UNEXPECTED_INTERRUPTION');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" 
                onClick={!isLoading ? onClose : undefined} 
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                className="relative w-full max-w-lg bg-black/40 border-2 border-blue-500/30 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden backdrop-blur-2xl"
            >
                {/* HUD Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
                
                {/* Scanning Light Line */}
                {isLoading && (
                    <motion.div 
                        initial={{ top: '-10%' }}
                        animate={{ top: '110%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] z-20"
                    />
                )}

                <div className="relative z-10 p-8">
                    <header className="flex items-center justify-between mb-8 border-b border-blue-500/20 pb-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-blue-400 animate-pulse" size={24} />
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter text-white">Zero Trust Authorization</h2>
                                <p className="text-[10px] font-mono text-blue-400 opacity-60">LINK_SECURE // SESSION_ID: {transactionId.slice(0, 12)}</p>
                            </div>
                        </div>
                        {!isLoading && (
                            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        )}
                    </header>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-red-950/30 border border-red-500/50 rounded-xl flex items-center gap-4 text-red-200"
                            >
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                                <span className="font-mono text-xs uppercase tracking-widest">{error}</span>
                            </motion.div>
                        )}

                        {currentStep === 'OTP' && (
                            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <Smartphone className="text-blue-400" size={64} />
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"
                                        />
                                    </div>
                                </div>
                                
                                <form onSubmit={handleOtpSubmit} className="space-y-6">
                                    <div className="space-y-2 text-center">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">Neural Link Challenge</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-slate-900/50 border-2 border-blue-500/20 rounded-2xl p-6 text-center text-4xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] transition-all"
                                            placeholder="XXXXXX"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || otpCode.length < 6}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)]"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Establish Link'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {currentStep === 'BIOMETRIC' && (
                            <motion.div key="bio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10 text-center">
                                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-2 border-dashed border-purple-500/30 rounded-full"
                                    />
                                    <Fingerprint className="text-purple-400" size={72} />
                                    {isLoading && (
                                        <motion.div 
                                            initial={{ y: -40 }} animate={{ y: 40 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                                            className="absolute w-full h-1 bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,1)]"
                                        />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Holographic Biometric Scan</h3>
                                    <p className="text-xs text-slate-400 font-mono">ENCRYPTED_AUTH_REQUIRED // BIO_HASH_VERIFY</p>
                                </div>
                                <button
                                    onClick={handleBiometricAuth}
                                    disabled={isLoading}
                                    className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_30px_rgba(147,51,234,0.2)]"
                                >
                                    {isLoading ? 'Scanning Pattern...' : 'Initiate Scan'}
                                </button>
                            </motion.div>
                        )}

                        {currentStep === 'DEVICE' && (
                            <motion.div key="dev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10 text-center">
                                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                    <motion.div 
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-2 border-blue-400/20 rounded-xl"
                                    />
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-4 border border-blue-400/40 rounded-full border-t-transparent"
                                    />
                                    <Cpu className="text-blue-400" size={64} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Hardware Attestation</h3>
                                    <p className="text-xs text-slate-400 font-mono">CRYPTOGRAPHIC_HANDSHAKE // TPM_2.0_LINK</p>
                                </div>
                                <button
                                    onClick={handleDeviceVerification}
                                    disabled={isLoading}
                                    className="w-full h-14 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                                >
                                    {isLoading ? 'Hashing Signature...' : 'Finalize Handshake'}
                                </button>
                            </motion.div>
                        )}

                        {currentStep === 'SUCCESS' && (
                            <motion.div 
                                key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className="py-12 space-y-6 text-center"
                            >
                                <div className="relative inline-block">
                                    <CheckCircle2 className="text-emerald-500" size={120} />
                                    <motion.div 
                                        initial={{ scale: 0 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 1, ease: 'easeOut' }}
                                        className="absolute inset-0 border-4 border-emerald-500 rounded-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Authorized</h3>
                                    <p className="text-xs font-mono text-emerald-400">TRANSACTION_${amount.toLocaleString()}_EMITTED</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Footer Readouts */}
                <footer className="p-4 bg-blue-500/5 border-t border-blue-500/10 flex justify-between items-center px-8">
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-blue-400/50">PROTOCOL</span>
                            <span className="text-[10px] font-mono text-blue-300">ARGUS_ZTP_V2</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-blue-400/50">TRUST_INDEX</span>
                            <span className="text-[10px] font-mono text-blue-300">99.8%</span>
                        </div>
                    </div>
                    <div className="h-4 w-[1px] bg-blue-500/20" />
                    <div className="flex gap-2">
                        {['OTP', 'BIO', 'DEV'].map((s, i) => (
                            <div key={s} className="flex flex-col items-center">
                                <div className={`w-1.5 h-1.5 rounded-full mb-1 ${
                                    (i === 0 && (verifiedOtp || currentStep === 'OTP')) || 
                                    (i === 1 && (verifiedBiometric || currentStep === 'BIOMETRIC')) ||
                                    (i === 2 && currentStep === 'DEVICE') ||
                                    currentStep === 'SUCCESS' ? 'bg-blue-400' : 'bg-slate-700'
                                }`} />
                                <span className="text-[8px] font-mono text-slate-500">{s}</span>
                            </div>
                        ))}
                    </div>
                </footer>
            </motion.div>
        </div>
    );
};
