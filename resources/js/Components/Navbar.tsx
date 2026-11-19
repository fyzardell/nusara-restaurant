import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { User } from '../types';
import { 
    Menu as MenuIcon, 
    X, 
    User as UserIcon, 
    LogOut, 
    Calendar, 
    QrCode, 
    ShoppingBag, 
    Sparkles, 
    PhoneCall,
    ShieldCheck
} from 'lucide-react';

interface Props {
    onOpenReservation?: () => void;
    onOpenOrderType?: () => void;
}

export default function Navbar({ onOpenReservation, onOpenOrderType }: Props) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 40) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            {/* Top Bar Announcement */}
            <div className="bg-[#211D1B] text-[#D4B886] border-b border-[#32151F] text-xs py-1.5 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-medium tracking-wider text-[11px] uppercase">
                            Single Branch Flagship · Senopati, Jakarta Selatan
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-[11px] text-[#F4EFE6]/80">
                        <span>Buka Setiap Hari: 11:00 – 22:30 WIB</span>
                        <a href="tel:+622155678900" className="flex items-center gap-1 hover:text-[#B99A65] transition-colors">
                            <PhoneCall className="w-3 h-3" />
                            <span>+62 21 5567 8900</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav 
                className={`transition-all duration-300 ${
                    scrolled 
                        ? 'bg-[#32151F]/95 backdrop-blur-md shadow-xl py-3 border-b border-[#B99A65]/20' 
                        : 'bg-gradient-to-b from-[#32151F]/90 via-[#32151F]/70 to-transparent py-4'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="group flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-[#B99A65]/60 bg-[#211D1B] flex items-center justify-center text-[#D4B886] shadow-inner group-hover:border-[#B99A65] transition-colors">
                                <span className="font-heading text-2xl font-bold tracking-tighter">N</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-heading text-2xl md:text-3xl font-bold tracking-widest text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors leading-none">
                                    NUSARA
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.25em] text-[#B99A65] mt-1 font-medium">
                                    Indonesian Dining
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden lg:flex items-center space-x-8 text-sm font-medium tracking-wide text-[#F4EFE6]/90">
                            <a href="#cerita" className="hover:text-[#D4B886] transition-colors">
                                Cerita & Filosofi
                            </a>
                            <a href="#menu" className="hover:text-[#D4B886] transition-colors">
                                Menu & Best Seller
                            </a>
                            <a href="#pengalaman" className="hover:text-[#D4B886] transition-colors">
                                Dining Experience
                            </a>
                            <a href="#alur-pesan" className="hover:text-[#D4B886] transition-colors">
                                Cara Memesan
                            </a>
                            <a href="#kontak" className="hover:text-[#D4B886] transition-colors">
                                Lokasi & Jam
                            </a>
                            <Link 
                                href="/splash" 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#32151F]/80 border border-[#B99A65]/40 text-[#D4B886] hover:bg-[#B99A65]/20 hover:border-[#D4B886] text-xs font-medium transition-all"
                                title="Lihat animasi logo reveal NUSARA"
                            >
                                <Sparkles className="w-3 h-3" />
                                <span>Logo Reveal</span>
                            </Link>
                        </div>

                        {/* Action Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            {/* Order Type Button */}
                            <button
                                onClick={onOpenOrderType}
                                className="px-3.5 py-2 text-xs font-semibold tracking-wider text-[#F4EFE6] border border-[#B99A65]/40 rounded-full hover:bg-[#B99A65]/15 transition-all flex items-center gap-2"
                            >
                                <QrCode className="w-3.5 h-3.5 text-[#D4B886]" />
                                <span>Pesan (Dine-in / Takeaway)</span>
                            </button>

                            {/* Reservation Button */}
                            <button
                                onClick={onOpenReservation}
                                className="px-4 py-2 text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Reservasi Meja</span>
                            </button>

                            {/* Auth Profile / Login */}
                            {auth?.user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211D1B] border border-[#B99A65]/50 text-[#F4EFE6] text-xs font-medium hover:border-[#D4B886] transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-[#32151F] text-[#D4B886] flex items-center justify-center font-bold text-xs">
                                            {auth.user.name.charAt(0)}
                                        </div>
                                        <span className="max-w-[100px] truncate">{auth.user.name}</span>
                                        <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-[#B99A65]/20 text-[#D4B886]">
                                            {auth.user.role}
                                        </span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {userDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-[#211D1B] border border-[#B99A65]/40 rounded-xl shadow-2xl py-2 z-50 text-xs">
                                            <div className="px-4 py-2 border-b border-[#32151F]">
                                                <p className="font-bold text-[#F4EFE6] truncate">{auth.user.name}</p>
                                                <p className="text-[11px] text-[#B99A65] truncate">{auth.user.email}</p>
                                                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    <span className="uppercase tracking-wider">Role: {auth.user.role}</span>
                                                </div>
                                            </div>
                                            <a
                                                href="#menu"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="block px-4 py-2 text-[#F4EFE6] hover:bg-[#32151F] transition-colors"
                                            >
                                                Daftar Favorit Saya
                                            </a>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                <span>Keluar (Logout)</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-xs font-semibold tracking-wider text-[#F4EFE6] hover:text-[#D4B886] flex items-center gap-1.5 transition-colors"
                                >
                                    <UserIcon className="w-3.5 h-3.5" />
                                    <span>Masuk</span>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Hamburger Button */}
                        <div className="flex md:hidden items-center gap-2">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-[#F4EFE6] hover:text-[#D4B886] transition-colors"
                                aria-label="Toggle Menu"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#211D1B] border-b border-[#B99A65]/30 px-6 pt-4 pb-6 space-y-4">
                        <div className="flex flex-col space-y-3 text-sm font-medium text-[#F4EFE6]">
                            <a 
                                href="#cerita" 
                                onClick={() => setMobileMenuOpen(false)} 
                                className="hover:text-[#D4B886] transition-colors py-1"
                            >
                                Cerita & Filosofi
                            </a>
                            <a 
                                href="#menu" 
                                onClick={() => setMobileMenuOpen(false)} 
                                className="hover:text-[#D4B886] transition-colors py-1"
                            >
                                Menu & Best Seller
                            </a>
                            <a 
                                href="#pengalaman" 
                                onClick={() => setMobileMenuOpen(false)} 
                                className="hover:text-[#D4B886] transition-colors py-1"
                            >
                                Dining Experience
                            </a>
                            <a 
                                href="#alur-pesan" 
                                onClick={() => setMobileMenuOpen(false)} 
                                className="hover:text-[#D4B886] transition-colors py-1"
                            >
                                Cara Memesan
                            </a>
                            <a 
                                href="#kontak" 
                                onClick={() => setMobileMenuOpen(false)} 
                                className="hover:text-[#D4B886] transition-colors py-1"
                            >
                                Lokasi & Jam Operasional
                            </a>
                            <Link
                                href="/splash"
                                onClick={() => setMobileMenuOpen(false)}
                                className="inline-flex items-center gap-2 text-[#D4B886] py-1 font-semibold"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Animasi Logo Reveal (Splashscreen)</span>
                            </Link>
                        </div>

                        <div className="pt-4 border-t border-[#32151F] flex flex-col gap-2.5">
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    onOpenOrderType?.();
                                }}
                                className="w-full py-2.5 text-xs font-semibold tracking-wider text-[#F4EFE6] border border-[#B99A65]/50 rounded-lg flex items-center justify-center gap-2"
                            >
                                <QrCode className="w-4 h-4 text-[#D4B886]" />
                                <span>Pesan (Dine-in QR / Takeaway)</span>
                            </button>

                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    onOpenReservation?.();
                                }}
                                className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] rounded-lg flex items-center justify-center gap-2 shadow-md"
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Reservasi Meja</span>
                            </button>

                            {auth?.user ? (
                                <div className="flex items-center justify-between pt-2">
                                    <div className="text-xs text-[#F4EFE6]">
                                        <p className="font-bold">{auth.user.name}</p>
                                        <p className="text-[10px] text-[#B99A65]">Role: {auth.user.role}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs text-rose-300 flex items-center gap-1"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="w-full py-2.5 text-xs font-semibold text-center text-[#F4EFE6] bg-[#32151F] border border-[#B99A65]/40 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <UserIcon className="w-4 h-4" />
                                    <span>Masuk ke Akun</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
