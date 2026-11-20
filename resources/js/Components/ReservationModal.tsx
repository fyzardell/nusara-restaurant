import React, { useState } from 'react';
import { DiningExperience } from '../types';
import { X, Calendar, Clock, Users, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    experiences: DiningExperience[];
    selectedExperience?: DiningExperience | null;
}

export default function ReservationModal({ isOpen, onClose, experiences, selectedExperience }: Props) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('+62');
    const [email, setEmail] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('18:30');
    const [guests, setGuests] = useState(2);
    const [experienceId, setExperienceId] = useState<number | string>(selectedExperience ? selectedExperience.id : '');
    const [specialRequest, setSpecialRequest] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-xl bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#F4EFE6] max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-[#F4EFE6]/60 hover:text-[#D4B886] hover:bg-[#32151F] transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {isSubmitted ? (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="font-heading text-3xl font-bold text-[#D4B886]">
                            Reservasi Berhasil Diterima
                        </h3>
                        <p className="text-sm text-[#F4EFE6]/80 max-w-md mx-auto leading-relaxed">
                            Terima kasih, <strong className="text-white">{name}</strong>. Tim reservasi NUSARA akan memverifikasi alokasi meja untuk <strong className="text-[#D4B886]">{guests} Tamu</strong> pada tanggal <strong className="text-white">{date}</strong> pukul <strong className="text-white">{time} WIB</strong> melalui WhatsApp / Telepon.
                        </p>
                        <div className="p-4 rounded-xl bg-[#32151F] border border-[#B99A65]/30 text-xs text-[#F4EFE6]/70 text-left">
                            <span className="font-semibold text-[#D4B886] block mb-1">Catatan Operasional:</span>
                            Sesuai PRD NUSARA, meja dialokasikan otomatis oleh staf kasir agar tidak bentrok. Meja akan disimpan maksimal 15 menit dari jam reservasi.
                        </div>
                        <button
                            onClick={() => {
                                setIsSubmitted(false);
                                onClose();
                            }}
                            className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-semibold text-xs tracking-wider uppercase hover:shadow-lg transition-all"
                        >
                            Tutup Jendela
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-3 border-b border-[#32151F] pb-3">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA — Nusantara & Rasa" 
                                className="h-8 sm:h-9 w-auto object-contain drop-shadow" 
                            />
                            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#B99A65] font-semibold">
                                <Sparkles className="w-4 h-4" />
                                <span>Reservasi Online</span>
                            </div>
                        </div>
                        <h2 className="font-heading text-3xl font-bold text-[#F4EFE6]">
                            Pengalaman Bersantap di NUSARA
                        </h2>
                        <p className="text-xs text-[#F4EFE6]/70 mt-1 mb-6">
                            Pastikan jamuan istimewa Anda disiapkan dengan sempurna oleh tim gastronomi kami.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                        Nama Lengkap *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Contoh: Raden Haryo"
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 focus:border-[#D4B886] focus:outline-none text-[#F4EFE6] text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                        Nomor WhatsApp / HP (+62) *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+6281234567890"
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 focus:border-[#D4B886] focus:outline-none text-[#F4EFE6] text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                        Tanggal Jamuan *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 focus:border-[#D4B886] focus:outline-none text-[#F4EFE6] text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                        Waktu Datang *
                                    </label>
                                    <select
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/30 focus:border-[#D4B886] focus:outline-none text-[#F4EFE6] text-xs"
                                    >
                                        <option value="11:30">11:30 WIB (Makan Siang)</option>
                                        <option value="12:30">12:30 WIB (Makan Siang)</option>
                                        <option value="13:30">13:30 WIB (Makan Siang)</option>
                                        <option value="18:00">18:00 WIB (Santap Malam)</option>
                                        <option value="19:00">19:00 WIB (Santap Malam)</option>
                                        <option value="20:00">20:00 WIB (Santap Malam)</option>
                                        <option value="20:30">20:30 WIB (Santap Malam)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                        Jumlah Tamu *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        required
                                        value={guests}
                                        onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 focus:border-[#D4B886] focus:outline-none text-[#F4EFE6] text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                    Paket Dining Experience (Opsional)
                                </label>
                                <select
                                    value={experienceId}
                                    onChange={(e) => setExperienceId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/30 focus:border-[#D4B886] focus:outline-none text-[#F4EFE6] text-xs"
                                >
                                    <option value="">A la Carte Dining Biasa (Pilih Menu di Tempat)</option>
                                    {experiences.map((exp) => (
                                        <option key={exp.id} value={exp.id}>
                                            {exp.name} ({exp.duration_minutes} Menit)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                    Catatan / Permintaan Khusus (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={specialRequest}
                                    onChange={(e) => setSpecialRequest(e.target.value)}
                                    placeholder="Contoh: Perayaan anniversary pernikahan, mohon kursi bayi, pantangan alergi kacang, dll."
                                    className="w-full px-4 py-2 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 focus:border-[#D4B886] focus:outline-none text-[#F4EFE6] text-xs"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all shadow-md active:scale-[0.99]"
                                >
                                    Kirim Permohonan Reservasi
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
