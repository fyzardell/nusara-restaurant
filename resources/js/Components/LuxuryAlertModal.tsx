import React from 'react';
import { CheckCircle2, AlertCircle, Info, ShieldCheck, X } from 'lucide-react';

export interface LuxuryAlertState {
    isOpen: boolean;
    type?: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
    confirmText?: string;
    onClose?: () => void;
}

interface Props {
    alert: LuxuryAlertState | null;
    onClose: () => void;
}

export default function LuxuryAlertModal({ alert, onClose }: Props) {
    if (!alert || !alert.isOpen) return null;

    const type = alert.type || 'info';

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
            case 'error':
                return <AlertCircle className="w-8 h-8 text-rose-400" />;
            case 'warning':
                return <AlertCircle className="w-8 h-8 text-amber-400" />;
            case 'info':
            default:
                return <Info className="w-8 h-8 text-[#D4B886]" />;
        }
    };

    const getBadgeStyle = () => {
        switch (type) {
            case 'success':
                return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
            case 'error':
                return 'bg-rose-950/80 border-rose-500/50 text-rose-300';
            case 'warning':
                return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
            case 'info':
            default:
                return 'bg-[#32151F] border-[#B99A65]/50 text-[#D4B886]';
        }
    };

    const handleConfirm = () => {
        if (alert.onClose) {
            alert.onClose();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
            <div 
                className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#211D1B] via-[#2A2421] to-[#211D1B] border border-[#B99A65]/50 shadow-2xl text-[#F4EFE6] space-y-5 animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close X Button */}
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Icon & Title */}
                <div className="flex flex-col items-center text-center space-y-3 pt-2">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${getBadgeStyle()}`}>
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="font-heading font-black text-xl sm:text-2xl text-[#F4EFE6] tracking-tight">
                            {alert.title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Perhatian' : 'Pemberitahuan')}
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mt-2 whitespace-pre-line">
                            {alert.message}
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-extrabold text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                        {alert.confirmText || 'Mengerti'}
                    </button>
                </div>
            </div>
        </div>
    );
}
