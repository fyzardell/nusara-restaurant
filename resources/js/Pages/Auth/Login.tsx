import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { DemoAccount } from '../../types';
import { 
    Lock, 
    Mail, 
    Phone, 
    Eye, 
    EyeOff, 
    ArrowLeft, 
    ShieldCheck, 
    Sparkles, 
    QrCode, 
    User, 
    CheckCircle2, 
    AlertCircle,
    KeyRound
} from 'lucide-react';

interface Props {
    demoAccounts: DemoAccount[];
    defaultRole: string;
    status?: string;
}

export default function Login({ demoAccounts, defaultRole = 'customer', status }: Props) {
    const [portalType, setPortalType] = useState<'customer' | 'staff'>(
        defaultRole === 'customer' ? 'customer' : 'staff'
    );
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        login_id: '',
        password: '',
        remember: false,
        portal_type: portalType,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    const handleSelectDemoAccount = (account: DemoAccount) => {
        setData({
            login_id: account.email,
            password: account.password,
            remember: true,
            portal_type: account.role === 'customer' ? 'customer' : 'staff',
        });
    };

    return (
        <div className="min-h-screen bg-[#211D1B] text-[#F4EFE6] font-body flex flex-col justify-between selection:bg-[#B99A65] selection:text-[#32151F] relative overflow-hidden">
            <Head title="Masuk — NUSARA Indonesian Dining" />

            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#32151F] blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#B99A65] blur-3xl opacity-30" />
            </div>

            {/* Header Navigation Bar */}
            <header className="relative z-10 px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#F4EFE6]/70 hover:text-[#D4B886] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Beranda NUSARA</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-[#B99A65] font-semibold hidden sm:inline">
                        Sistem Autentikasi Terpadu
                    </span>
                </div>
            </header>

            {/* Main Login Card Container */}
            <main className="relative z-10 max-w-md mx-auto w-full px-4 py-8">
                <div className="bg-[#181413]/90 border border-[#B99A65]/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                    {/* Brand Header */}
                    <div className="text-center mb-6">
                        <Link href="/" className="inline-flex items-center justify-center mb-3 group">
                            <div className="w-12 h-12 rounded-full border border-[#B99A65] bg-[#32151F] flex items-center justify-center text-[#D4B886] shadow-xl group-hover:scale-105 transition-transform">
                                <span className="font-heading text-2xl font-bold">N</span>
                            </div>
                        </Link>
                        <h1 className="font-heading text-3xl font-bold tracking-wide text-[#F4EFE6]">
                            Selamat Datang di NUSARA
                        </h1>
                        <p className="text-xs text-[#F4EFE6]/70 mt-1">
                            Akses keanggotaan restoran atau portal manajemen operasional
                        </p>
                    </div>

                    {/* Portal Switcher Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#32151F] border border-[#B99A65]/30 mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setPortalType('customer');
                                setData('portal_type', 'customer');
                            }}
                            className={`py-2.5 rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all ${
                                portalType === 'customer'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold shadow-md'
                                    : 'text-[#F4EFE6]/70 hover:text-[#F4EFE6]'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Pelanggan</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setPortalType('staff');
                                setData('portal_type', 'staff');
                            }}
                            className={`py-2.5 rounded-xl text-xs font-semibold tracking-wider flex items-center justify-center gap-2 transition-all ${
                                portalType === 'staff'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold shadow-md'
                                    : 'text-[#F4EFE6]/70 hover:text-[#F4EFE6]'
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Portal Staf</span>
                        </button>
                    </div>

                    {/* Quick Demo Credentials Pill Selector */}
                    <div className="mb-6 p-3 rounded-2xl bg-[#32151F]/40 border border-[#B99A65]/20">
                        <div className="flex items-center justify-between text-[11px] text-[#B99A65] font-semibold mb-2">
                            <span className="flex items-center gap-1">
                                <KeyRound className="w-3.5 h-3.5" />
                                Demo Akun Instan (Klik untuk Isi):
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {demoAccounts
                                .filter(acc => portalType === 'customer' ? acc.role === 'customer' : acc.role !== 'customer')
                                .map((acc) => (
                                    <button
                                        key={acc.role}
                                        type="button"
                                        onClick={() => handleSelectDemoAccount(acc)}
                                        className="p-2 rounded-xl bg-[#211D1B] border border-[#B99A65]/30 hover:border-[#D4B886] text-left transition-all active:scale-95 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-[#D4B886]">
                                                {acc.badge}
                                            </span>
                                            <span className="text-[9px] text-emerald-400">Pilih</span>
                                        </div>
                                        <div className="text-[11px] font-semibold text-[#F4EFE6] truncate mt-0.5">
                                            {acc.email}
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Guest Dine-in Notice (PRD Section 4.1) */}
                    {portalType === 'customer' && (
                        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-[#32151F] to-[#211D1B] border border-[#B99A65]/30 flex items-start gap-3">
                            <QrCode className="w-5 h-5 text-[#D4B886] flex-shrink-0 mt-0.5" />
                            <div className="text-[11px] text-[#F4EFE6]/80 leading-relaxed">
                                <strong className="text-white block font-semibold mb-0.5">Makan di Tempat (Dine-in)?</strong>
                                Anda tidak wajib login untuk memesan di meja! Cukup scan QR yang terpasang di atas meja Anda.
                            </div>
                        </div>
                    )}

                    {/* Status Feedback */}
                    {status && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email / Phone Field */}
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                {portalType === 'customer' ? 'Email atau Nomor HP (+62)' : 'Email Staf / Kredensial'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                    {portalType === 'customer' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={data.login_id}
                                    onChange={(e) => setData('login_id', e.target.value)}
                                    placeholder={portalType === 'customer' ? 'pelanggan@nusara.id atau +62812...' : 'admin@nusara.id'}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/40 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] placeholder-[#F4EFE6]/30 font-mono"
                                />
                            </div>
                            {errors.login_id && (
                                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{errors.login_id}</span>
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#B99A65]">
                                    Kata Sandi
                                </label>
                                {portalType === 'customer' && (
                                    <button
                                        type="button"
                                        onClick={() => alert('Fitur reset password melalui link email/WhatsApp terdaftar.')}
                                        className="text-[11px] text-[#D4B886] hover:underline"
                                    >
                                        Lupa Sandi?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/40 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] placeholder-[#F4EFE6]/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#F4EFE6]/50 hover:text-[#D4B886]"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{errors.password}</span>
                                </p>
                            )}
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded bg-[#32151F] border-[#B99A65] text-[#B99A65] focus:ring-0 cursor-pointer"
                            />
                            <label htmlFor="remember" className="ml-2 text-xs text-[#F4EFE6]/70 cursor-pointer">
                                Ingat sesi login saya
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        >
                            <span>{processing ? 'Memverifikasi Kredensial...' : (portalType === 'customer' ? 'Masuk ke Akun Member' : 'Masuk ke Portal Staf')}</span>
                        </button>
                    </form>

                    {/* Google Sign-in Option for Customer (PRD Section 3.3) */}
                    {portalType === 'customer' && (
                        <div className="mt-5 pt-5 border-t border-[#32151F]">
                            <button
                                type="button"
                                onClick={() => {
                                    setData({
                                        login_id: 'pelanggan@nusara.id',
                                        password: 'password123',
                                        remember: true,
                                        portal_type: 'customer',
                                    });
                                    alert('Simulasi Google Sign-In: Mengisi akun Google terhubung pelanggan@nusara.id');
                                }}
                                className="w-full py-2.5 rounded-xl border border-stone-700 bg-stone-900/80 hover:bg-stone-800 text-[#F4EFE6] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                                <span>Lanjutkan dengan Google</span>
                            </button>

                            <p className="text-center text-xs text-[#F4EFE6]/60 mt-4">
                                Belum menjadi member?{' '}
                                <button
                                    type="button"
                                    onClick={() => handleSelectDemoAccount(demoAccounts[0])}
                                    className="text-[#D4B886] font-semibold hover:underline"
                                >
                                    Daftar Akun Baru
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer Minimalist */}
            <footer className="relative z-10 py-4 text-center text-[11px] text-[#F4EFE6]/40">
                <p>© {new Date().getFullYear()} NUSARA Indonesian Dining Experience · Single Branch Senopati</p>
            </footer>
        </div>
    );
}
