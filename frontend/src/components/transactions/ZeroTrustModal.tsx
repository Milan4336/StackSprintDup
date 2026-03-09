import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint, Smartphone, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
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

    // Verification state tokens
    const [verifiedOtp, setVerifiedOtp] = useState<string | null>(null);
    const [verifiedBiometric, setVerifiedBiometric] = useState<string | null>(null);

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length < 6) {
            setError('Invalid OTP code');
            return;
        }
        setError(null);
        setIsLoading(true);
        setTimeout(() => {
            setVerifiedOtp(otpCode);
            setIsLoading(false);
            setCurrentStep('BIOMETRIC');
        }, 1000);
    };

    const handleBiometricAuth = () => {
        setError(null);
        setIsLoading(true);
        setTimeout(() => {
            setVerifiedBiometric('bio-token-12345');
            setIsLoading(false);
            setCurrentStep('DEVICE');
        }, 1500);
    };

    const handleDeviceVerification = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const deviceToken = 'device-token-abcde';

            // Submit all tokens to the backend
            await apiClient.post(`/transactions/${transactionId}/verify`, {
                otpCode: verifiedOtp,
                biometricToken: verifiedBiometric,
                deviceToken
            });

            setIsLoading(false);
            setCurrentStep('SUCCESS');
            setTimeout(() => {
                onSuccess();
            }, 2000);

        } catch (err) {
            setIsLoading(false);
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || 'Verification failed on server');
            } else {
                setError('Verification failed');
            }
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header Indicator */}
                <div className="h-1.5 w-full bg-slate-800 flex">
                    <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: '33%' }}
                        animate={{
                            width: currentStep === 'OTP' ? '33%' :
                                currentStep === 'BIOMETRIC' ? '66%' :
                                    '100%'
                        }}
                    />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-white mb-2">Zero Trust Verification</h2>
                        <p className="text-sm text-slate-400">
                            High-risk transaction detected (${amount.toLocaleString()}). Additional verification required.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm"
                            >
                                <AlertCircle size={16} />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        {currentStep === 'OTP' && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-blue-500/10 rounded-full">
                                        <Smartphone className="text-blue-400" size={32} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-sm font-semibold text-white">Step 1: One-Time Password</h3>
                                        <p className="text-xs text-slate-400 mt-1">Enter the 6-digit code sent to your registered device.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleOtpSubmit} className="space-y-4">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || otpCode.length < 6}
                                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Code'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {currentStep === 'BIOMETRIC' && (
                            <motion.div
                                key="biometric"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-purple-500/10 rounded-full relative overflow-hidden group">
                                        {isLoading && <div className="absolute inset-0 bg-purple-500/20 animate-pulse" />}
                                        <Fingerprint className={`text-purple-400 ${isLoading ? 'animate-pulse' : ''}`} size={48} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-sm font-semibold text-white">Step 2: Biometric Authentication</h3>
                                        <p className="text-xs text-slate-400 mt-1">Please authenticate using Touch ID or Face ID.</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleBiometricAuth}
                                        disabled={isLoading}
                                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Authenticate'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'DEVICE' && (
                            <motion.div
                                key="device"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-emerald-500/10 rounded-full">
                                        <ShieldCheck className="text-emerald-400" size={48} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-sm font-semibold text-white">Step 3: Device Verification</h3>
                                        <p className="text-xs text-slate-400 mt-1">Completing cryptographic device handshake.</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleDeviceVerification}
                                        disabled={isLoading}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Finalize Verification'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'SUCCESS' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-8 space-y-4 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                >
                                    <CheckCircle2 className="text-emerald-500" size={64} />
                                </motion.div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Verification Complete</h3>
                                    <p className="text-sm text-slate-400 mt-1">Transaction approved and processed.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
