import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode, Sparkles, ExternalLink, Users, MapPin } from 'lucide-react';
import { RestaurantTable } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    table: RestaurantTable | null;
}

export default function TableQrExportModal({ isOpen, onClose, table }: Props) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const tableUrl = typeof window !== 'undefined' && table
        ? `${window.location.origin}/order?table=${encodeURIComponent(table.table_number)}`
        : '';

    useEffect(() => {
        if (!isOpen || !table) return;

        // Generate high-resolution QR data URL
        QRCode.toDataURL(tableUrl, {
            width: 480,
            margin: 2,
            color: {
                dark: '#141110',
                light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H',
        })
            .then(url => {
                setQrDataUrl(url);
            })
            .catch(err => {
                console.error('Gagal generate QR code:', err);
            });
    }, [isOpen, table, tableUrl]);

    if (!isOpen || !table) return null;

    const handleCopyUrl = () => {
        if (!tableUrl) return;
        navigator.clipboard.writeText(tableUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownloadRawQr = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.download = `QR-Only-${table.table_number.replace(/\s+/g, '-')}.png`;
        link.href = qrDataUrl;
        link.click();
    };

    const handleDownloadStandCardPng = () => {
        if (!qrDataUrl) return;
        setIsGenerating(true);

        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1800;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsGenerating(false);
            return;
        }

        // 1. Background Luxury Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1800);
        bgGrad.addColorStop(0, '#1A0C11');
        bgGrad.addColorStop(0.3, '#26121B');
        bgGrad.addColorStop(0.7, '#1E0E15');
        bgGrad.addColorStop(1, '#11090D');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1200, 1800);

        // 2. Decorative Outer Border (Double Gold Stroke)
        ctx.strokeStyle = '#B99A65';
        ctx.lineWidth = 6;
        ctx.strokeRect(50, 50, 1100, 1700);

        ctx.strokeStyle = '#D4B886';
        ctx.lineWidth = 2;
        ctx.strokeRect(65, 65, 1070, 1670);

        // Corner Ornaments
        const drawCornerOrnament = (x: number, y: number) => {
            ctx.fillStyle = '#D4B886';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        };
        drawCornerOrnament(50, 50);
        drawCornerOrnament(1150, 50);
        drawCornerOrnament(50, 1750);
        drawCornerOrnament(1150, 1750);

        // 3. Header Branding
        ctx.textAlign = 'center';
        ctx.fillStyle = '#D4B886';
        ctx.font = 'bold 34px "Cinzel", "Playfair Display", serif';
        ctx.letterSpacing = '6px';
        ctx.fillText('N U S A R A', 600, 160);

        ctx.font = 'italic 20px "Cinzel", serif';
        ctx.fillStyle = '#B99A65';
        ctx.fillText('INDONESIAN FINE DINING EXPERIENCE', 600, 205);

        // Small divider line with diamond
        ctx.strokeStyle = '#B99A65';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(400, 240);
        ctx.lineTo(800, 240);
        ctx.stroke();

        ctx.fillStyle = '#D4B886';
        ctx.save();
        ctx.translate(600, 240);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();

        // 4. Table Number Badge
        ctx.fillStyle = '#F4EFE6';
        ctx.font = '900 84px "Playfair Display", "Cinzel", serif';
        ctx.fillText(table.table_number.toUpperCase(), 600, 370);

        ctx.font = '500 24px sans-serif';
        ctx.fillStyle = '#B99A65';
        const metaText = `${table.capacity} Kursi Tamu · ${table.location || 'Dining Hall'}`;
        ctx.fillText(metaText, 600, 420);

        // 5. Draw QR Code Frame & Image
        const qrSize = 620;
        const qrX = (1200 - qrSize) / 2;
        const qrY = 490;

        // White Card for QR code
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50, 36);
        ctx.fill();

        ctx.strokeStyle = '#D4B886';
        ctx.lineWidth = 6;
        ctx.stroke();

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

            // 6. Call to Action Text below QR
            ctx.fillStyle = '#F4EFE6';
            ctx.font = 'bold 36px "Cinzel", serif';
            ctx.fillText('PINDAI UNTUK MEMESAN', 600, 1230);

            ctx.font = 'italic 24px "Cinzel", serif';
            ctx.fillStyle = '#D4B886';
            ctx.fillText('Scan with Phone Camera to Order', 600, 1280);

            // Explanatory note
            ctx.fillStyle = '#E5DFD7';
            ctx.font = '22px sans-serif';
            ctx.fillText('Tanpa perlu akun atau login.', 600, 1370);
            ctx.fillText('Cukup masukkan nama Anda saat konfirmasi pesanan.', 600, 1410);

            // URL badge
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.roundRect(250, 1480, 700, 64, 18);
            ctx.fill();
            ctx.strokeStyle = '#B99A65';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#D4B886';
            ctx.font = 'mono 22px monospace';
            const displayUrl = tableUrl.replace(/^https?:\/\//, '');
            ctx.fillText(displayUrl.length > 45 ? displayUrl.substring(0, 42) + '...' : displayUrl, 600, 1520);

            // Footer
            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#8C827A';
            ctx.fillText('NUSARA Senopati Flagship · Jakarta Selatan', 600, 1680);

            // Trigger Download
            const downloadLink = document.createElement('a');
            downloadLink.download = `Kartu-Meja-${table.table_number.replace(/\s+/g, '-')}-NUSARA.png`;
            downloadLink.href = canvas.toDataURL('image/png');
            downloadLink.click();
            setIsGenerating(false);
        };
        img.src = qrDataUrl;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div 
                className="relative w-full max-w-xl p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#1C1715] via-[#241E1B] to-[#1C1715] border border-[#B99A65]/50 shadow-2xl text-[#F4EFE6] space-y-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 border-b border-[#342D2A] pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#32151F] border border-[#B99A65]/50 flex items-center justify-center shadow-md">
                        <QrCode className="w-6 h-6 text-[#D4B886]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading font-black text-xl text-white">
                                QR Code {table.table_number}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50">
                                Khusus Admin
                            </span>
                        </div>
                        <p className="text-xs text-[#9E938B]">
                            Pindai langsung untuk memesan menu tanpa wajib login
                        </p>
                    </div>
                </div>

                {/* Acrylic Stand Card Preview */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1A0C11] via-[#26121B] to-[#141110] border-2 border-[#B99A65]/70 shadow-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden">
                    {/* Inner gold border */}
                    <div className="absolute inset-1.5 border border-[#D4B886]/30 rounded-xl pointer-events-none" />

                    {/* Branding */}
                    <div>
                        <h4 className="font-heading tracking-[0.25em] text-xs font-bold text-[#D4B886] uppercase">
                            NUSARA
                        </h4>
                        <p className="text-[10px] tracking-widest text-[#B99A65] italic">
                            Indonesian Fine Dining Experience
                        </p>
                    </div>

                    {/* Table Title */}
                    <div>
                        <h2 className="font-heading text-3xl font-black text-[#F4EFE6] tracking-tight">
                            {table.table_number}
                        </h2>
                        <p className="text-[11px] text-[#B99A65] flex items-center justify-center gap-2 mt-0.5">
                            <span>{table.capacity} Kursi</span>
                            <span>·</span>
                            <span>{table.location || 'Dining Hall'}</span>
                        </p>
                    </div>

                    {/* QR Code Graphic Frame */}
                    <div className="p-3 bg-white rounded-2xl border-2 border-[#D4B886] shadow-lg">
                        {qrDataUrl ? (
                            <img 
                                src={qrDataUrl} 
                                alt={`QR Code ${table.table_number}`} 
                                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                            />
                        ) : (
                            <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-stone-400">
                                Memuat QR...
                            </div>
                        )}
                    </div>

                    {/* Instruction */}
                    <div className="space-y-1">
                        <p className="font-heading font-bold text-sm text-[#F4EFE6] uppercase tracking-wider">
                            Pindai untuk Memesan
                        </p>
                        <p className="text-[11px] text-stone-300">
                            Scan with camera to order · Tanpa perlu login akun
                        </p>
                        <p className="text-[10px] text-[#D4B886]">
                            (Wajib isi nama pemesan saat checkout)
                        </p>
                    </div>
                </div>

                {/* URL Bar & Copy */}
                <div className="p-3 rounded-xl bg-[#141110] border border-[#342D2A] flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-stone-300 truncate text-[11px] select-all">
                        {tableUrl}
                    </span>
                    <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="px-3 py-1.5 rounded-lg bg-[#32151F] border border-[#B99A65]/40 hover:border-[#D4B886] text-[#D4B886] hover:text-white flex items-center gap-1.5 shrink-0 transition-colors font-medium text-xs"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
                    </button>
                </div>

                {/* Action Buttons: Export PNG & Raw QR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                        type="button"
                        disabled={isGenerating || !qrDataUrl}
                        onClick={handleDownloadStandCardPng}
                        className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        <span>{isGenerating ? 'Memproses PNG...' : 'Ekspor Kartu Stand (PNG)'}</span>
                    </button>

                    <button
                        type="button"
                        disabled={!qrDataUrl}
                        onClick={handleDownloadRawQr}
                        className="py-3 px-4 rounded-xl bg-[#211D1B] border border-[#B99A65]/50 text-[#D4B886] hover:text-white hover:bg-[#32151F] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                        <QrCode className="w-4 h-4" />
                        <span>Unduh QR Saja (PNG)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
