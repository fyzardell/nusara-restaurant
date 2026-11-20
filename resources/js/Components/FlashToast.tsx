import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Props {
    flash?: {
        success?: string;
        error?: string;
    };
    durationMs?: number;
}

export default function FlashToast({ flash, durationMs = 3000 }: Props) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<'success' | 'error'>('success');

    const sanitizeMessage = (msg: string | null | undefined): string | null => {
        if (!msg) return null;
        // Bersihkan duplikasi role seperti (Admin) (Admin) atau spasi berulang
        return msg
            .replace(/\(([^)]+)\)\s*\(\1\)/gi, '($1)')
            .replace(/\s+/g, ' ')
            .trim();
    };

    useEffect(() => {
        if (flash?.success) {
            setMessage(sanitizeMessage(flash.success));
            setType('success');
            setVisible(true);
        } else if (flash?.error) {
            setMessage(sanitizeMessage(flash.error));
            setType('error');
            setVisible(true);
        } else {
            setVisible(false);
            setMessage(null);
        }

        if (flash?.success || flash?.error) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, durationMs);

            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error, durationMs]);

    if (!visible || !message) return null;

    return (
        <div 
            role="status"
            aria-live="polite"
            className={`fixed top-4 right-4 z-[9999] p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all duration-300 transform animate-in fade-in slide-in-from-top-3 ${
                type === 'success'
                    ? 'bg-[#32151F]/95 border border-[#B99A65] text-[#F4EFE6]'
                    : 'bg-rose-950/95 border border-rose-500 text-rose-100'
            }`}
        >
            {type === 'success' ? (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                </div>
            ) : (
                <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center flex-shrink-0 text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                </div>
            )}

            <div className="text-xs sm:text-sm font-medium pr-1 max-w-sm">
                {message}
            </div>

            <button
                onClick={() => setVisible(false)}
                className="p-1 rounded-full text-[#F4EFE6]/60 hover:text-[#D4B886] hover:bg-black/20 transition-colors ml-1"
                aria-label="Tutup notifikasi"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
