import React, { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { LogOut, CheckCircle2, Info, X } from 'lucide-react';

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title?: string;
    description?: string;
    userName?: string;
    userRole?: string;
    cartCount?: number;
    customNotice?: string;
    confirmButtonText?: string;
}

export default function LogoutConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi Keluar Akun',
    description = 'Apakah Anda yakin ingin keluar dari akun Anda?',
    userName,
    userRole,
    cartCount = 0,
    customNotice,
    confirmButtonText = 'Ya, Keluar Akun',
}: LogoutConfirmModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            router.post('/logout');
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="relative w-full max-w-sm bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 shadow-2xl text-[#F4EFE6] text-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Tutup"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-3">
                    <LogOut className="w-6 h-6" />
                </div>

                {/* Header */}
                <h3 className="font-heading text-xl font-bold text-[#F4EFE6] mb-1">
                    {title}
                </h3>
                
                {userName ? (
                    <p className="text-xs text-[#D4B886] font-medium mb-2">
                        {userName} {userRole && <span className="text-stone-400 font-normal">({userRole})</span>}
                    </p>
                ) : null}

                <p className="text-xs text-[#F4EFE6]/70 mb-4 leading-relaxed">
                    {description}
                </p>

                {/* Conditional Alert Notice */}
                {cartCount > 0 ? (
                    <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs text-left mb-5 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                            Tenang! <strong>{cartCount} pesanan</strong> di keranjang Anda telah tersimpan dengan aman dan tidak akan hilang saat Anda masuk kembali.
                        </span>
                    </div>
                ) : customNotice ? (
                    <div className="p-3 rounded-2xl bg-[#32151F]/70 border border-[#B99A65]/30 text-[#F4EFE6]/80 text-xs text-left mb-5 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-[#D4B886] shrink-0 mt-0.5" />
                        <span>{customNotice}</span>
                    </div>
                ) : (
                    <div className="p-3 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/20 text-[#F4EFE6]/70 text-xs text-left mb-5 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-[#D4B886] shrink-0 mt-0.5" />
                        <span>
                            Sesi Anda saat ini akan diakhiri dengan aman. Anda dapat masuk kembali kapan saja.
                        </span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-xl border border-stone-700 bg-stone-900/60 hover:bg-stone-800 text-[#F4EFE6] text-xs font-semibold transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition-all shadow-md active:scale-98"
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
