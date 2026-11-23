import React, { useState } from 'react';
import { X, QrCode, ShoppingBag, CheckCircle, Info, ArrowRight, Check } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectDineIn: (tableNumber: string) => void;
    onSelectTakeaway: () => void;
}

export default function OrderTypeModal({ isOpen, onClose, onSelectDineIn, onSelectTakeaway }: Props) {
    const [selectedMode, setSelectedMode] = useState<'dine_in' | 'takeaway'>('dine_in');
    const [tableInput, setTableInput] = useState('03');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#F4EFE6]">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-[#F4EFE6]/60 hover:text-[#D4B886] hover:bg-[#32151F] transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="flex justify-center mb-3">
                        <img 
                            src="/images/nusara-logo.png" 
                            alt="NUSARA — Nusantara & Rasa" 
                            className="h-9 sm:h-10 w-auto object-contain drop-shadow" 
                        />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65]">
                        Sistem Pemesanan Restoran
                    </span>
                    <h2 className="font-heading text-3xl font-bold text-[#F4EFE6] mt-1">
                        Pilih Metode Pemesanan
                    </h2>
                    <p className="text-xs text-[#F4EFE6]/70 mt-1 max-w-sm mx-auto">
                        Sesuai standar operasional NUSARA, pilih cara bersantap yang Anda inginkan hari ini.
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-[#32151F] border border-[#B99A65]/30 mb-6">
                    <button
                        onClick={() => setSelectedMode('dine_in')}
                        className={`py-3 px-4 rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all ${
                            selectedMode === 'dine_in'
                                ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md font-bold'
                                : 'text-[#F4EFE6]/70 hover:text-[#D4B886]'
                        }`}
                    >
                        <QrCode className="w-4 h-4" />
                        <span>Dine-in (Makan di Tempat)</span>
                    </button>
                    <button
                        onClick={() => setSelectedMode('takeaway')}
                        className={`py-3 px-4 rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all ${
                            selectedMode === 'takeaway'
                                ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md font-bold'
                                : 'text-[#F4EFE6]/70 hover:text-[#D4B886]'
                        }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Takeaway (Bawa Pulang)</span>
                    </button>
                </div>

                {/* Mode Content */}
                {selectedMode === 'dine_in' ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[#32151F]/70 border border-[#B99A65]/20 space-y-2">
                            <div className="flex items-start gap-2.5">
                                <Info className="w-4 h-4 text-[#D4B886] mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-[#F4EFE6]/80 leading-relaxed">
                                    <strong className="text-white">Dine-in via QR Meja:</strong> Anda tidak diwajibkan membuat akun atau login. Cukup pastikan nomor meja sesuai dengan meja tempat Anda duduk.
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-2">
                                Simulasi Nomor Meja (Meja 01 s/d 10 - Kapasitas 5 Orang):
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="font-heading text-lg font-bold text-[#D4B886]">Meja</span>
                                <select
                                    value={tableInput}
                                    onChange={(e) => setTableInput(e.target.value)}
                                    className="flex-grow px-4 py-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] text-sm font-bold focus:outline-none focus:border-[#D4B886]"
                                >
                                    <option value="01">Meja 01 (Kapasitas 5 Orang - Main Dining Hall)</option>
                                    <option value="02">Meja 02 (Kapasitas 5 Orang - Main Dining Hall)</option>
                                    <option value="03">Meja 03 (Kapasitas 5 Orang - Main Dining Hall)</option>
                                    <option value="04">Meja 04 (Kapasitas 5 Orang - Main Dining Hall)</option>
                                    <option value="05">Meja 05 (Kapasitas 5 Orang - Garden Terrace)</option>
                                    <option value="06">Meja 06 (Kapasitas 5 Orang - Garden Terrace)</option>
                                    <option value="07">Meja 07 (Kapasitas 5 Orang - VIP Heritage Room)</option>
                                    <option value="08">Meja 08 (Kapasitas 5 Orang - VIP Heritage Room)</option>
                                    <option value="09">Meja 09 (Kapasitas 5 Orang - Royal Pavilion)</option>
                                    <option value="10">Meja 10 (Kapasitas 5 Orang - Royal Pavilion)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => onSelectDineIn(tableInput)}
                            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                        >
                            <span>Mulai Pesan di Meja {tableInput} (Mode Tamu / Tanpa Login)</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[#32151F]/70 border border-[#B99A65]/20 space-y-2">
                            <div className="flex items-start gap-2.5">
                                <Info className="w-4 h-4 text-[#D4B886] mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-[#F4EFE6]/80 leading-relaxed">
                                    <strong className="text-white">Takeaway (Self-Pickup):</strong> Pesan sekarang, bayar secara online, dan ambil pesanan Anda langsung di konter kasir NUSARA tanpa antre dan tanpa meja.
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#211D1B] border border-stone-800 text-[11px] text-[#F4EFE6]/70 space-y-2">
                            <p className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Tidak dikenakan biaya layanan meja (table charge)</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Kemasan daun pisang & box ramah lingkungan kedap panas</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Notifikasi status pesanan saat makanan siap diambil (Ready)</span>
                            </p>
                        </div>

                        <button
                            onClick={onSelectTakeaway}
                            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                        >
                            <span>Lanjut ke Menu Takeaway</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
