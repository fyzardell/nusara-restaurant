import React from 'react';
import { Link } from '@inertiajs/react';
import { X, Heart, LogIn, Sparkles } from 'lucide-react';
import { Menu } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    menu: Menu | null;
}

export default function FavoriteLoginPromptModal({ isOpen, onClose, menu }: Props) {
    if (!isOpen || !menu) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-[#211D1B] border border-[#B99A65]/50 rounded-3xl p-6 sm:p-7 shadow-2xl text-[#F4EFE6] text-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-[#F4EFE6]/60 hover:text-[#D4B886] hover:bg-[#32151F] transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex justify-center mb-4">
                    <img 
                        src="/images/nusara-logo.png" 
                        alt="NUSARA — Nusantara & Rasa" 
                        className="h-9 w-auto object-contain drop-shadow" 
                    />
                </div>

                <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center mb-3">
                    <Heart className="w-7 h-7 fill-rose-500" />
                </div>

                <div className="flex items-center justify-center text-[10px] uppercase tracking-widest text-[#B99A65] font-bold mb-1">
                    <span>Fitur Eksklusif Member NUSARA</span>
                </div>

                <h3 className="font-heading text-2xl font-bold text-[#F4EFE6]">
                    Simpan Menu Favorit Anda
                </h3>

                <p className="text-xs text-[#F4EFE6]/75 mt-2 leading-relaxed">
                    Anda ingin menyimpan <strong className="text-[#D4B886]">{menu.name}</strong>. Sesuai ketentuan PRD NUSARA, untuk menyimpan favorit secara permanen dan melihatnya lintas perangkat, Anda perlu masuk ke akun Anda.
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                    <Link
                        href="/login?role=customer"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>Masuk atau Daftar Akun</span>
                    </Link>

                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl border border-[#32151F] hover:bg-[#32151F] text-[#F4EFE6]/60 hover:text-[#F4EFE6] text-xs font-medium transition-colors"
                    >
                        Nanti Saja
                    </button>
                </div>
            </div>
        </div>
    );
}
