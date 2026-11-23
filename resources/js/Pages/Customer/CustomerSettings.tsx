import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
    User as UserIcon, 
    Lock, 
    ShieldCheck, 
    KeyRound, 
    CheckCircle2, 
    AlertCircle, 
    QrCode, 
    Copy, 
    Check, 
    RefreshCw, 
    Smartphone, 
    LogOut,
    ArrowRight,
    ShieldAlert
} from 'lucide-react';
import { User } from '../../types';

interface Props {
    user: User | null;
    isGuest: boolean;
    onBackToMenu: () => void;
}

interface ProfileData {
    name: string;
    phone: string;
    email: string;
    avatar?: string;
    has_password: boolean;
    two_factor_enabled: boolean;
    google_linked: boolean;
}

export default function CustomerSettings({ user, isGuest, onBackToMenu }: Props) {
    const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'two_factor'>('profile');
    const [profile, setProfile] = useState<ProfileData>({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        avatar: user?.avatar,
        has_password: true,
        two_factor_enabled: false,
        google_linked: Boolean(user?.google_id),
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile form state
    const [nameInput, setNameInput] = useState(user?.name || '');
    const [phoneInput, setPhoneInput] = useState(user?.phone || '');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 2FA state
    const [setupSecret, setSetupSecret] = useState<string | null>(null);
    const [setupQrUrl, setSetupQrUrl] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [isSettingUp2fa, setIsSettingUp2fa] = useState(false);
    const [isVerifying2fa, setIsVerifying2fa] = useState(false);
    const [isDisabling2fa, setIsDisabling2fa] = useState(false);
    const [disableCode, setDisableCode] = useState('');
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    // Fetch initial profile & 2FA status
    useEffect(() => {
        if (isGuest || !user) {
            setIsLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch('/customer/profile', {
                    headers: { 'Accept': 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setProfile(data.user);
                        setNameInput(data.user.name || '');
                        setPhoneInput(data.user.phone || '');
                    }
                }
            } catch (e) {
                console.error('Failed to load customer profile:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [isGuest, user]);

    // Handle Profile Update
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSavingProfile(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/customer/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    name: nameInput,
                    phone: phoneInput,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage({ type: 'success', text: data.message || 'Profil berhasil diperbarui!' });
                setProfile(prev => ({ ...prev, name: nameInput, phone: phoneInput }));
            } else {
                setMessage({ type: 'error', text: data.message || 'Gagal memperbarui profil.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kendala jaringan saat menyimpan profil.' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Handle Password Update
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Kata sandi baru minimal harus 8 karakter.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
            return;
        }

        setIsSavingPassword(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/customer/password/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage({ type: 'success', text: data.message || 'Kata sandi berhasil diperbarui!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.message || 'Gagal memperbarui kata sandi.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kendala jaringan saat memperbarui kata sandi.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    // Start 2FA Setup
    const handleStart2faSetup = async () => {
        setMessage(null);
        setIsSettingUp2fa(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/customer/2fa/setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSetupSecret(data.secret);
                setSetupQrUrl(data.qr_code_url);
            } else {
                setMessage({ type: 'error', text: data.message || 'Gagal memulai penyiapan 2FA.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan saat memuat kode QR 2FA.' });
        } finally {
            setIsSettingUp2fa(false);
        }
    };

    // Confirm 2FA Code
    const handleConfirm2fa = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (verifyCode.trim().length !== 6) {
            setMessage({ type: 'error', text: 'Masukkan 6 digit angka kode Google Authenticator.' });
            return;
        }

        setIsVerifying2fa(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/customer/2fa/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ code: verifyCode.trim() }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage({ type: 'success', text: data.message || 'Google Authenticator 2FA berhasil diaktifkan!' });
                setProfile(prev => ({ ...prev, two_factor_enabled: true }));
                setSetupSecret(null);
                setSetupQrUrl(null);
                setVerifyCode('');
            } else {
                setMessage({ type: 'error', text: data.message || 'Kode verifikasi salah atau telah kadaluarsa.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan saat memverifikasi 2FA.' });
        } finally {
            setIsVerifying2fa(false);
        }
    };

    // Disable 2FA
    const handleDisable2fa = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsDisabling2fa(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/customer/2fa/disable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ code: disableCode.trim() }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage({ type: 'success', text: data.message || '2FA berhasil dinonaktifkan.' });
                setProfile(prev => ({ ...prev, two_factor_enabled: false }));
                setShowDisableModal(false);
                setDisableCode('');
            } else {
                setMessage({ type: 'error', text: data.message || 'Kode atau kata sandi tidak sesuai.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan saat mematikan 2FA.' });
        } finally {
            setIsDisabling2fa(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    // Guest view
    if (isGuest || !user) {
        return (
            <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] text-center space-y-5 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-[#B99A65]/20 border border-[#B99A65] flex items-center justify-center mx-auto text-[#D4B886]">
                        <UserIcon className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#D4B886]">
                            Pengaturan Akun Pelanggan
                        </h2>
                        <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
                            Anda saat ini memesan sebagai Tamu Meja. Masuk atau daftarkan akun eksklusif NUSARA untuk mengubah username, mengamankan kata sandi, dan mengaktifkan Google Authenticator (2FA).
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <a
                            href="/login"
                            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all text-center"
                        >
                            Masuk ke Akun
                        </a>
                        <a
                            href="/auth/google"
                            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-[#F4EFE6] hover:bg-white/15 font-bold text-xs flex items-center justify-center gap-2 transition-all text-center"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            <span>Masuk dengan Google</span>
                        </a>
                        <button
                            type="button"
                            onClick={onBackToMenu}
                            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-stone-600 text-stone-300 hover:text-white text-xs font-semibold"
                        >
                            Kembali ke Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
            {/* Header Profil Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] flex items-center justify-center font-heading font-black text-2xl shadow-lg flex-shrink-0">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <h2 className="font-heading font-black text-xl text-[#F4EFE6]">
                                {profile.name}
                            </h2>
                            {profile.two_factor_enabled && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    2FA Aktif
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#D4B886] font-mono mt-0.5">
                            {profile.email}
                        </p>
                        {profile.google_linked && (
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-300 mt-1">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                <span>Terhubung dengan Akun Google</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onBackToMenu}
                        className="px-4 py-2.5 rounded-xl border border-[#B99A65]/40 hover:bg-[#32151F] text-[#D4B886] font-bold text-xs transition-all"
                    >
                        Kembali ke Menu
                    </button>
                    <a
                        href="/logout"
                        onClick={(e) => {
                            e.preventDefault();
                            router.post('/logout');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar</span>
                    </a>
                </div>
            </div>

            {/* Notification / Toast Message */}
            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-fadeIn ${
                    message.type === 'success' 
                        ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' 
                        : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="flex-1">{message.text}</span>
                </div>
            )}

            {/* Navigation Tabs for Settings */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => { setActiveSection('profile'); setMessage(null); }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeSection === 'profile'
                            ? 'bg-[#32151F] text-[#D4B886] shadow-md'
                            : 'text-stone-600 hover:text-[#32151F] hover:bg-stone-100'
                    }`}
                >
                    <UserIcon className="w-4 h-4" />
                    <span>Profil & Username</span>
                </button>

                <button
                    type="button"
                    onClick={() => { setActiveSection('password'); setMessage(null); }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeSection === 'password'
                            ? 'bg-[#32151F] text-[#D4B886] shadow-md'
                            : 'text-stone-600 hover:text-[#32151F] hover:bg-stone-100'
                    }`}
                >
                    <KeyRound className="w-4 h-4" />
                    <span>Ganti Kata Sandi</span>
                </button>

                <button
                    type="button"
                    onClick={() => { setActiveSection('two_factor'); setMessage(null); }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeSection === 'two_factor'
                            ? 'bg-[#32151F] text-[#D4B886] shadow-md'
                            : 'text-stone-600 hover:text-[#32151F] hover:bg-stone-100'
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Google Authenticator (2FA)</span>
                    {profile.two_factor_enabled && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                </button>
            </div>

            {/* Section 1: Profil & Username */}
            {activeSection === 'profile' && (
                <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5">
                    <div className="border-b border-stone-100 pb-3">
                        <h3 className="font-heading font-extrabold text-base text-[#211D1B]">
                            Pengaturan Profil & Username
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                            Perbarui identitas pemesan untuk kemudahan penyajian dan reservasi restoran.
                        </p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                Nama Pengguna / Username
                            </label>
                            <input
                                type="text"
                                required
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="Contoh: Raden Wijaya"
                                className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                Alamat Email Terdaftar
                            </label>
                            <input
                                type="email"
                                disabled
                                value={profile.email}
                                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-100 text-xs text-stone-500 font-mono cursor-not-allowed"
                            />
                            <span className="text-[11px] text-stone-400 mt-1 block">
                                Email adalah identitas utama akun Anda dan tidak dapat diubah.
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                Nomor WhatsApp / Telepon
                            </label>
                            <input
                                type="text"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="Contoh: 08123456789"
                                className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65] font-mono"
                            />
                            <span className="text-[11px] text-stone-400 mt-1 block">
                                Digunakan untuk konfirmasi pesanan dan concierge staf kasir.
                            </span>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:from-[#a88954] hover:to-[#c3a775] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Section 2: Ganti Kata Sandi */}
            {activeSection === 'password' && (
                <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5">
                    <div className="border-b border-stone-100 pb-3">
                        <h3 className="font-heading font-extrabold text-base text-[#211D1B]">
                            Perbarui Kata Sandi Akun
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                            Gunakan kombinasi minimal 8 karakter dengan huruf, angka, dan simbol untuk keamanan maksimal.
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                        {profile.has_password && (
                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                    Kata Sandi Saat Ini
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Masukkan kata sandi lama Anda"
                                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65]"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                Kata Sandi Baru
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimal 8 karakter"
                                className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                Konfirmasi Kata Sandi Baru
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi kata sandi baru"
                                className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65]"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:from-[#a88954] hover:to-[#c3a775] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSavingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Section 3: Google Authenticator (2FA) */}
            {activeSection === 'two_factor' && (
                <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6">
                    <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                        <div>
                            <h3 className="font-heading font-extrabold text-base text-[#211D1B] flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-[#B99A65]" />
                                <span>Autentikasi Dua Langkah (Google Authenticator)</span>
                            </h3>
                            <p className="text-xs text-stone-500 mt-0.5">
                                Lindungi akun NUSARA Anda dengan kode 6-digit TOTP dari aplikasi Google Authenticator.
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            profile.two_factor_enabled 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}>
                            {profile.two_factor_enabled ? 'Aktif' : 'Belum Aktif'}
                        </span>
                    </div>

                    {profile.two_factor_enabled ? (
                        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-[#211D1B]">
                                        Akun Anda Terlindungi Google Authenticator
                                    </h4>
                                    <p className="text-xs text-stone-600 leading-relaxed">
                                        Setiap kali Anda masuk ke sistem NUSARA, Anda akan diminta memasukkan 6-digit kode acak dari aplikasi Google Authenticator di perangkat seluler Anda.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowDisableModal(true)}
                                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs transition-colors"
                            >
                                Nonaktifkan 2FA
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {!setupSecret ? (
                                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Smartphone className="w-6 h-6 text-[#946E2D] flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-[#211D1B]">
                                                Cara Kerja Google Authenticator
                                            </h4>
                                            <p className="text-xs text-stone-600 leading-relaxed">
                                                1. Pasang aplikasi <strong>Google Authenticator</strong> di ponsel Anda (tersedia gratis di Play Store dan App Store).<br />
                                                2. Pindai QR Code yang akan kami tampilkan.<br />
                                                3. Masukkan 6 digit kode yang tampil di aplikasi untuk mengonfirmasi.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleStart2faSetup}
                                        disabled={isSettingUp2fa}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:from-[#a88954] hover:to-[#c3a775] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {isSettingUp2fa ? 'Menyiapkan...' : 'Mulai Setup Google Authenticator'}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] space-y-5 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <h4 className="font-heading font-extrabold text-base text-[#D4B886] flex items-center gap-2">
                                            <QrCode className="w-5 h-5" />
                                            <span>Pindai QR Code di Google Authenticator</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setSetupSecret(null)}
                                            className="text-xs text-stone-400 hover:text-white"
                                        >
                                            Batal
                                        </button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        {setupQrUrl && (
                                            <div className="p-3 bg-white rounded-2xl shadow-xl flex-shrink-0">
                                                <img 
                                                    src={setupQrUrl} 
                                                    alt="Google Authenticator QR Code" 
                                                    className="w-44 h-44 object-contain"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-3 flex-1 text-center sm:text-left">
                                            <p className="text-xs text-stone-300 leading-relaxed">
                                                Buka aplikasi Google Authenticator, tekan ikon <strong>(+)</strong> lalu pilih <strong>Pindai kode QR</strong>. Jika tidak dapat memindai, gunakan kunci penyiapan berikut:
                                            </p>
                                            
                                            <div className="p-3 rounded-xl bg-black/40 border border-[#B99A65]/40 flex items-center justify-between gap-2">
                                                <span className="font-mono text-sm tracking-widest text-[#D4B886] font-bold truncate">
                                                    {setupSecret}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(setupSecret)}
                                                    className="p-1.5 rounded-lg bg-[#32151F] hover:bg-[#B99A65] text-[#D4B886] hover:text-[#211D1B] transition-colors"
                                                    title="Salin Kunci Setup"
                                                >
                                                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            <form onSubmit={handleConfirm2fa} className="space-y-3 pt-2">
                                                <label className="block text-xs font-bold text-stone-300">
                                                    Masukkan 6-Digit Kode Konfirmasi:
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        required
                                                        autoFocus
                                                        value={verifyCode}
                                                        onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                        placeholder="Contoh: 123456"
                                                        className="w-44 text-center tracking-[0.25em] font-mono text-lg font-bold py-2 px-3 rounded-xl bg-black/60 border border-[#B99A65] text-[#D4B886] focus:outline-none focus:ring-2 focus:ring-[#D4B886]"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={isVerifying2fa || verifyCode.length !== 6}
                                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        {isVerifying2fa ? 'Verifikasi...' : 'Aktifkan 2FA'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Konfirmasi Nonaktifkan 2FA */}
            {showDisableModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-md p-6 rounded-3xl bg-[#211D1B] border border-[#B99A65]/40 text-[#F4EFE6] space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-rose-400">
                            <ShieldAlert className="w-6 h-6" />
                            <h3 className="font-heading font-black text-lg">
                                Nonaktifkan Google Authenticator?
                            </h3>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed">
                            Masukkan 6 digit kode saat ini dari aplikasi Google Authenticator Anda atau masukkan kata sandi akun untuk mengonfirmasi:
                        </p>

                        <form onSubmit={handleDisable2fa} className="space-y-4">
                            <input
                                type="text"
                                required
                                autoFocus
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value)}
                                placeholder="Kode 6-digit atau Kata Sandi"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-white text-xs focus:outline-none focus:border-[#D4B886]"
                            />

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowDisableModal(false); setDisableCode(''); }}
                                    className="px-4 py-2 rounded-xl border border-stone-600 text-stone-300 hover:text-white text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDisabling2fa || !disableCode.trim()}
                                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                                >
                                    {isDisabling2fa ? 'Memproses...' : 'Ya, Nonaktifkan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
