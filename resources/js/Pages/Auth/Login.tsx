import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import NusaraAssembleLoading from '../../Components/NusaraAssembleLoading';
import { DemoAccount } from '../../types';
import { 
    Lock, 
    Mail, 
    Phone, 
    Eye, 
    EyeOff, 
    ArrowLeft, 
    Sparkles, 
    QrCode, 
    CheckCircle2, 
    AlertCircle,
    ChevronDown,
    ChevronUp,
    KeyRound,
    User as UserIcon,
    ArrowRight,
    ShieldCheck,
    UtensilsCrossed,
    Crown
} from 'lucide-react';

interface Props {
    demoAccounts: DemoAccount[];
    status?: string;
    initialMode?: 'login' | 'register';
}

const HERO_SLIDES = [
    {
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=85',
        title: 'Perjamuan Agung Keraton',
        subtitle: 'Meja santap mewah bernuansa temaram berbalut tembaga ukir dan wastra kesultanan tempo doeloe.',
        tag: 'Pusaka Gastronomi Nusantara'
    },
    {
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=1600&q=85',
        title: 'Mahakarya Bakaran & Rendang Wagyu',
        subtitle: 'Daging Wagyu Tokusen dimasak perlahan 48 jam berpadu arang batok kelapa dan rempah kepulauan.',
        tag: 'Signature 48-Hour Wagyu'
    },
    {
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',
        title: 'Suasana Intim & Hangat',
        subtitle: 'Ruang santap beraroma melati segar dan kayu jati hangat, cocok untuk momen istimewa dan jamuan privat.',
        tag: 'Cita Rasa Nusantara'
    }
];

export default function Login({ demoAccounts, status, initialMode = 'login' }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    
    // Auth mode state: 'login' | 'register'
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    
    // Slide index for image carousel
    const [activeSlide, setActiveSlide] = useState(0);

    // Password visibility
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Demo accounts drawer
    const [showDemoDrawer, setShowDemoDrawer] = useState(false);

    const redirectParam = typeof window !== 'undefined' 
        ? (new URLSearchParams(window.location.search).get('redirect') || '') 
        : '';

    // Auto advance carousel slides every 3s (dipercepat sesuai arahan)
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // Sync mode with URL search params if user navigated with ?tab=
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const tabParam = new URLSearchParams(window.location.search).get('tab');
            if (tabParam === 'register') {
                setMode('register');
            } else if (tabParam === 'login') {
                setMode('login');
            }
        }
    }, []);

    // Assemble Loading Animation State (hanya saat login)
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loadingStatusText, setLoadingStatusText] = useState('Memverifikasi Sesi');

    // 1. Form Login
    const { 
        data: loginData, 
        setData: setLoginData, 
        post: postLogin, 
        processing: loginProcessing, 
        errors: loginErrors, 
        reset: resetLogin,
        setError: setLoginError,
        clearErrors: clearLoginErrors
    } = useForm({
        login_id: '',
        password: '',
        remember: false,
        redirect: redirectParam,
    });

    // 2. Form Register
    const { 
        data: registerData, 
        setData: setRegisterData, 
        post: postRegister, 
        processing: registerProcessing, 
        errors: registerErrors, 
        reset: resetRegister 
    } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        agree_terms: false,
        redirect: redirectParam,
    });

    const executeLogin = async (idToUse?: string, passToUse?: string, customRedirect?: string) => {
        clearLoginErrors();
        setIsLoggingIn(true);
        setLoadingStatusText('Memverifikasi Akun...');
        const startTime = Date.now();

        const id = idToUse ?? loginData.login_id;
        const pass = passToUse ?? loginData.password;
        const targetRedirect = customRedirect !== undefined ? customRedirect : (loginData.redirect || redirectParam);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const res = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    login_id: id,
                    password: pass,
                    remember: loginData.remember,
                    redirect: targetRedirect,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setIsLoggingIn(false);
                if (errData.errors) {
                    if (errData.errors.login_id) {
                        setLoginError('login_id', errData.errors.login_id[0]);
                    }
                    if (errData.errors.password) {
                        setLoginError('password', errData.errors.password[0]);
                    }
                } else if (errData.message) {
                    setLoginError('password', errData.message);
                } else {
                    setLoginError('password', 'Gagal memverifikasi akun. Silakan periksa kembali kredensial Anda.');
                }
                resetLogin('password');
                return;
            }

            const data = await res.json();
            setLoadingStatusText(
                targetRedirect && targetRedirect.includes('table=') 
                    ? 'Menghubungkan ke Meja 01...' 
                    : 'Menyiapkan Meja & Sesi...'
            );

            // Biarkan animasi Nusara Assemble berjalan mulus sampai seluruh elemen dan kilau emas selesai (~3.8s)
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 3800 - elapsed);

            setTimeout(() => {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    window.location.href = targetRedirect || '/';
                }
            }, remaining);
        } catch {
            setIsLoggingIn(false);
            setLoginError('password', 'Terjadi kendala jaringan saat memproses login.');
        }
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeLogin();
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postRegister('/register', {
            onFinish: () => resetRegister('password', 'password_confirmation'),
        });
    };

    const handleSelectDemoAccount = (account: DemoAccount, autoSubmit: boolean = false) => {
        setMode('login');
        const targetRedirect = account.redirect || redirectParam;
        setLoginData({
            login_id: account.email,
            password: account.password,
            remember: true,
            redirect: targetRedirect,
        });
        if (autoSubmit) {
            executeLogin(account.email, account.password, targetRedirect);
        }
    };

    return (
        <div className="min-h-screen bg-[#141110] text-[#F4EFE6] font-body flex flex-col justify-between selection:bg-[#B99A65] selection:text-[#32151F] relative overflow-x-hidden">
            <Head title={mode === 'login' ? 'Masuk ke Akun — NUSARA' : 'Daftar Anggota — NUSARA'} />

            {/* Assemble Loading Animation Khusus Saat Login */}
            <NusaraAssembleLoading isOpen={isLoggingIn} statusText={loadingStatusText} />

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#32151F]/40 blur-[140px]" />
                <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-[#B99A65]/15 blur-[160px]" />
                <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-[#211D1B] blur-[120px]" />
            </div>

            {/* Flash Toast Feedback */}
            <FlashToast flash={flash?.success || flash?.error ? flash : (status ? { success: status } : undefined)} durationMs={3000} />

            {/* Main Interactive Dual Sliding Page Layout (Halaman Penuh, Bukan Card) */}
            <main className="relative z-10 w-full flex-1 flex flex-col justify-center min-h-[calc(100vh-60px)] py-4 sm:py-6">
                <div className="relative w-full h-full flex-1 grid grid-cols-1 lg:grid-cols-2">
                    
                    {/* ========================================================
                        KOLOM 1 (KIRI): FORMULIR MASUK (LOGIN)
                        Terlihat saat mode === 'login' (gambar geser ke kanan)
                    ======================================================== */}
                    <div className={`px-6 sm:px-12 lg:px-16 py-8 flex flex-col justify-center transition-opacity duration-500 ${
                        mode === 'login' ? 'opacity-100' : 'opacity-0 lg:pointer-events-none'
                    } ${mode === 'register' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="max-w-md w-full mx-auto">
                            {/* Brand Header */}
                            <div className="mb-6">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#211D1B] hover:bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] hover:text-[#F4EFE6] text-xs font-semibold tracking-wide transition-all mb-4 group shadow-sm w-fit"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#B99A65]" />
                                    <span>Kembali ke Beranda</span>
                                </Link>
                                <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#F4EFE6] leading-tight">
                                    Masuk ke Akun Anda
                                </h1>
                                <p className="text-xs text-[#F4EFE6]/65 mt-1.5 leading-relaxed">
                                    Gunakan email atau nomor WhatsApp terdaftar untuk melanjutkan pesanan & reservasi.
                                </p>
                            </div>

                            {/* Form Input Fields */}
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                {/* Email / Phone */}
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                        Email atau Nomor WhatsApp
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={loginData.login_id}
                                            onChange={(e) => setLoginData('login_id', e.target.value)}
                                            placeholder="nama@email.com atau 081234..."
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/35 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] focus:ring-1 focus:ring-[#D4B886] placeholder-[#F4EFE6]/30 transition-all font-mono"
                                        />
                                    </div>
                                    {loginErrors.login_id && (
                                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{loginErrors.login_id}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#B99A65]">
                                            Kata Sandi
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => alert('Petunjuk pemulihan kata sandi dapat dikonfirmasi melalui Concierge WhatsApp NUSARA: +62 21 5567 8900')}
                                            className="text-[11px] text-[#D4B886] hover:underline transition-colors"
                                        >
                                            Lupa Sandi?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showLoginPassword ? 'text' : 'password'}
                                            required
                                            value={loginData.password}
                                            onChange={(e) => setLoginData('password', e.target.value)}
                                            placeholder="Masukkan kata sandi..."
                                            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/35 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] focus:ring-1 focus:ring-[#D4B886] placeholder-[#F4EFE6]/30 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#F4EFE6]/50 hover:text-[#D4B886] transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {loginErrors.password && (
                                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{loginErrors.password}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={loginData.remember}
                                            onChange={(e) => setLoginData('remember', e.target.checked)}
                                            className="w-4 h-4 rounded bg-[#32151F] border-[#B99A65]/50 text-[#B99A65] focus:ring-0 cursor-pointer"
                                        />
                                        <span className="text-xs text-[#F4EFE6]/70">Ingat sesi saya</span>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loginProcessing}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#B99A65]/20 mt-2"
                                >
                                    <span>{loginProcessing ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>

                            {/* Divider & Social Login */}
                            <div className="mt-5 pt-4 border-t border-[#32151F]">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoginData({
                                                login_id: 'pelanggan@nusara.id',
                                                password: 'password123',
                                                remember: true,
                                                redirect: redirectParam,
                                            });
                                            alert('Simulasi Google Auth: Akun pelanggan@nusara.id telah disiapkan.');
                                        }}
                                        className="py-2.5 px-3 rounded-xl border border-stone-700 bg-stone-900/60 hover:bg-stone-800 text-[#F4EFE6] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                        </svg>
                                        <span>Google</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            alert('Simulasi WhatsApp Fast Login: Kode OTP instan akan dikirimkan ke nomor WhatsApp Anda.');
                                        }}
                                        className="py-2.5 px-3 rounded-xl border border-emerald-900/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Phone className="w-4 h-4 text-emerald-400" />
                                        <span>WhatsApp OTP</span>
                                    </button>
                                </div>

                                {/* Switch to Register Trigger */}
                                <div className="text-center mt-5 text-xs text-[#F4EFE6]/70">
                                    Belum memiliki akun member?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('register')}
                                        className="text-[#D4B886] font-bold hover:underline ml-1"
                                    >
                                        Daftar Sekarang
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Subtle Developer Quick Test Drawer */}
                        <div className="mt-6 pt-3 border-t border-stone-800">
                            <button
                                type="button"
                                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                                className="w-full flex items-center justify-between text-[11px] text-[#F4EFE6]/50 hover:text-[#D4B886] transition-colors py-1"
                            >
                                <span className="flex items-center gap-1.5 font-mono">
                                    <KeyRound className="w-3.5 h-3.5 text-[#B99A65]" />
                                    <span>Akun Demo Cepat (1-Click Test)</span>
                                </span>
                                {showDemoDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {showDemoDrawer && (
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#32151F]/40 animate-in fade-in duration-300">
                                    {demoAccounts.map((acc) => {
                                        const isSpecialMeja = acc.email === 'meja01@nusara.id';
                                        return (
                                            <button
                                                key={acc.email}
                                                type="button"
                                                onClick={() => handleSelectDemoAccount(acc, true)}
                                                className={`p-2.5 rounded-xl border text-left transition-all text-[10px] group flex flex-col justify-between ${
                                                    isSpecialMeja 
                                                        ? 'col-span-2 bg-[#32151F]/60 border-[#D4B886]/60 hover:bg-[#32151F]/90 hover:border-[#D4B886] shadow-sm' 
                                                        : 'bg-[#211D1B] border-[#B99A65]/30 hover:border-[#D4B886] hover:bg-[#32151F]/60'
                                                }`}
                                                title={`Klik untuk langsung masuk sebagai ${acc.title}`}
                                            >
                                                <div className="flex items-center justify-between w-full mb-1">
                                                    <span className="font-semibold text-[#D4B886] flex items-center gap-1.5">
                                                        {isSpecialMeja && <QrCode className="w-3.5 h-3.5 text-[#D4B886]" />}
                                                        <span>{acc.badge}</span>
                                                    </span>
                                                    <span className="text-[9px] text-[#B99A65] font-mono opacity-80 group-hover:opacity-100 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-bold">
                                                        {acc.redirect ? 'Mulai Dine-in (Meja 01) &rarr;' : 'Masuk &rarr;'}
                                                    </span>
                                                </div>
                                                <div className="text-[#F4EFE6]/70 truncate text-[10px] flex items-center justify-between">
                                                    <span className="font-mono">{acc.email}</span>
                                                    {acc.desc && <span className="text-[9px] text-[#B99A65]/80 italic hidden sm:inline ml-2">{acc.desc}</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* ========================================================
                        KOLOM 2 (KANAN): FORMULIR DAFTAR (REGISTER)
                        Terlihat saat mode === 'register' (gambar geser ke kiri)
                    ======================================================== */}
                    <div className={`px-6 sm:px-12 lg:px-16 py-8 flex flex-col justify-center transition-opacity duration-500 ${
                        mode === 'register' ? 'opacity-100' : 'opacity-0 lg:pointer-events-none'
                    } ${mode === 'login' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="max-w-md w-full mx-auto">
                            {/* Brand Header */}
                            <div className="mb-5">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#211D1B] hover:bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] hover:text-[#F4EFE6] text-xs font-semibold tracking-wide transition-all mb-3.5 group shadow-sm w-fit"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#B99A65]" />
                                    <span>Kembali ke Beranda</span>
                                </Link>
                                <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#F4EFE6] leading-tight">
                                    Daftar Akun Member
                                </h1>
                                <p className="text-xs text-[#F4EFE6]/65 mt-1 leading-relaxed">
                                    Nikmati kemudahan simpan menu favorit, riwayat pembelian, dan akses reservasi prioritas.
                                </p>
                            </div>

                            {/* Form Input Fields */}
                            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1">
                                        Nama Lengkap
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={registerData.name}
                                            onChange={(e) => setRegisterData('name', e.target.value)}
                                            placeholder="Nama lengkap Anda..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/35 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] focus:ring-1 focus:ring-[#D4B886] placeholder-[#F4EFE6]/30 transition-all"
                                        />
                                    </div>
                                    {registerErrors.name && (
                                        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                            <span>{registerErrors.name}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Phone & Email Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1">
                                            No. WhatsApp / HP
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                value={registerData.phone}
                                                onChange={(e) => setRegisterData('phone', e.target.value)}
                                                placeholder="08123456789"
                                                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/35 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] font-mono placeholder-[#F4EFE6]/30"
                                            />
                                        </div>
                                        {registerErrors.phone && (
                                            <p className="mt-1 text-[11px] text-rose-400">{registerErrors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1">
                                            Alamat Email
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={registerData.email}
                                                onChange={(e) => setRegisterData('email', e.target.value)}
                                                placeholder="nama@email.com"
                                                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/35 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] font-mono placeholder-[#F4EFE6]/30"
                                            />
                                        </div>
                                        {registerErrors.email && (
                                            <p className="mt-1 text-[11px] text-rose-400">{registerErrors.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Password & Confirm Password */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1">
                                            Kata Sandi (Min. 8)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <input
                                                type={showRegisterPassword ? 'text' : 'password'}
                                                required
                                                value={registerData.password}
                                                onChange={(e) => setRegisterData('password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/35 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] placeholder-[#F4EFE6]/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#F4EFE6]/50 hover:text-[#D4B886]"
                                                tabIndex={-1}
                                            >
                                                {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                        {registerErrors.password && (
                                            <p className="mt-1 text-[11px] text-rose-400">{registerErrors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1">
                                            Ulangi Sandi
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B99A65]">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                value={registerData.password_confirmation}
                                                onChange={(e) => setRegisterData('password_confirmation', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#32151F]/50 border border-[#B99A65]/35 text-[#F4EFE6] text-xs focus:outline-none focus:border-[#D4B886] placeholder-[#F4EFE6]/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#F4EFE6]/50 hover:text-[#D4B886]"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Conditions Agreement */}
                                <div className="pt-1">
                                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            required
                                            checked={registerData.agree_terms}
                                            onChange={(e) => setRegisterData('agree_terms', e.target.checked)}
                                            className="w-4 h-4 mt-0.5 rounded bg-[#32151F] border-[#B99A65]/50 text-[#B99A65] focus:ring-0 cursor-pointer"
                                        />
                                        <span className="text-[11px] text-[#F4EFE6]/70 leading-snug">
                                            Saya menyetujui <span className="text-[#D4B886] font-semibold">Syarat & Kebijakan Privasi</span> keanggotaan eksklusif NUSARA Dining.
                                        </span>
                                    </label>
                                    {registerErrors.agree_terms && (
                                        <p className="mt-1 text-[11px] text-rose-400">{registerErrors.agree_terms}</p>
                                    )}
                                </div>

                                {/* Submit Register Button */}
                                <button
                                    type="submit"
                                    disabled={registerProcessing}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#B99A65]/20 mt-2"
                                >
                                    <span>{registerProcessing ? 'Mendaftarkan Akun...' : 'Daftar Anggota Sekarang'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>

                            {/* Switch to Login Trigger */}
                            <div className="text-center mt-5 text-xs text-[#F4EFE6]/70 pt-3 border-t border-[#32151F]">
                                Sudah memiliki akun terdaftar?{' '}
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className="text-[#D4B886] font-bold hover:underline ml-1"
                                >
                                    Masuk di Sini
                                </button>
                            </div>
                        </div>

                        {/* Guest QR Callout */}
                        <div className="mt-4 p-3 rounded-2xl bg-[#32151F]/40 border border-[#B99A65]/20 flex items-center gap-2.5">
                            <QrCode className="w-4 h-4 text-[#D4B886] flex-shrink-0" />
                            <p className="text-[11px] text-[#F4EFE6]/70">
                                Sudah berada di meja resto? Scan QR di meja untuk memesan instan tanpa registrasi.
                            </p>
                        </div>
                    </div>


                    {/* ========================================================
                        SLIDING HERO IMAGE PANEL (DESKTOP)
                        - Bila mode === 'register': Gambar di KIRI (translate-x-0)
                        - Bila mode === 'login': Gambar bergeser ke KANAN (translate-x-full)
                    ======================================================== */}
                    <div 
                        className={`hidden lg:block absolute top-0 bottom-0 w-1/2 z-30 transition-transform duration-700 cubic-bezier(0.65, 0, 0.35, 1) pointer-events-auto ${
                            mode === 'register' ? 'translate-x-0' : 'translate-x-full'
                        }`}
                    >
                        <div className="relative w-full h-full overflow-hidden shadow-2xl bg-[#141110]">
                            {/* Photographic Background Images with Fade Transition */}
                            {HERO_SLIDES.map((slide, idx) => (
                                <div
                                    key={slide.title}
                                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                                        idx === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                                    }`}
                                >
                                    <img 
                                        src={slide.image} 
                                        alt={slide.title}
                                        className="w-full h-full object-cover object-center transform transition-transform duration-10000 ease-out"
                                    />
                                    {/* Gradients to enhance text readability & luxury tone */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#141110] via-[#211D1B]/60 to-[#141110]/50" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#32151F]/40 via-transparent to-[#211D1B]/40" />
                                </div>
                            ))}

                            {/* Overlay Content */}
                            <div className="relative z-10 w-full h-full p-8 sm:p-12 flex flex-col justify-between text-[#F4EFE6]">
                                {/* Top Branding on Visual */}
                                <div className="flex items-center justify-between">
                                    <Link href="/" className="inline-flex items-center gap-3 group">
                                        <img 
                                            src="/images/nusara-logo.png" 
                                            alt="NUSARA — Nusantara & Rasa" 
                                            className="h-12 w-auto object-contain drop-shadow-xl group-hover:scale-105 transition-transform" 
                                        />
                                    </Link>
                                    <span className="px-3 py-1 rounded-full bg-[#141110]/80 backdrop-blur-md border border-[#B99A65]/40 text-[10px] font-bold text-[#D4B886] uppercase tracking-wider">
                                        {HERO_SLIDES[activeSlide].tag}
                                    </span>
                                </div>

                                {/* Center Highlight Quote */}
                                <div className="my-auto py-6 space-y-4">
                                    <div className="inline-block px-3 py-0.5 rounded-full bg-[#B99A65]/20 border border-[#B99A65]/40 text-[11px] font-mono text-[#D4B886]">
                                        Mahakarya Gastronomi Indonesia
                                    </div>
                                    <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#F4EFE6] leading-snug drop-shadow-lg">
                                        {HERO_SLIDES[activeSlide].title}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[#F4EFE6]/80 leading-relaxed max-w-md drop-shadow">
                                        {HERO_SLIDES[activeSlide].subtitle}
                                    </p>
                                </div>

                                {/* Bottom Carousel Pagination & Quick Switch Action */}
                                <div className="pt-4 border-t border-[#F4EFE6]/15 flex items-center justify-between">
                                    {/* Pagination Dots (like the burger reference image) */}
                                    <div className="flex items-center gap-2">
                                        {HERO_SLIDES.map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setActiveSlide(i)}
                                                className={`transition-all duration-300 rounded-full ${
                                                    activeSlide === i 
                                                        ? 'w-7 h-2 bg-[#D4B886] shadow-md shadow-[#D4B886]/50' 
                                                        : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                                                }`}
                                                aria-label={`Slide ${i + 1}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Slide Trigger Button directly on image */}
                                    <button
                                        type="button"
                                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                        className="px-4 py-2 rounded-full bg-[#141110]/80 hover:bg-[#32151F] border border-[#B99A65]/50 text-xs font-semibold text-[#D4B886] hover:text-[#F4EFE6] backdrop-blur-md transition-all shadow-md flex items-center gap-2"
                                    >
                                        <span>{mode === 'login' ? 'Buka Pendaftaran' : 'Buka Halaman Masuk'}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer Minimalist */}
            <footer className="relative z-20 py-4 px-6 text-center text-[11px] text-[#F4EFE6]/40">
                <p>© {new Date().getFullYear()} NUSARA Indonesian Dining Experience · Harmoni Rasa Nusantara Berbalut Kemewahan</p>
            </footer>
        </div>
    );
}
