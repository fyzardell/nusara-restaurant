// resources/js/Components/AdminSidebar.tsx
import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import LogoutConfirmModal from './LogoutConfirmModal';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    UtensilsCrossed, 
    QrCode, 
    Calendar, 
    MessageSquare, 
    History, 
    CreditCard, 
    Utensils, 
    ExternalLink, 
    LogOut, 
    ChevronRight, 
    X,
    Menu as MenuIcon
} from 'lucide-react';
import { User } from '../types';

export type AdminActiveNav = 'overview' | 'orders' | 'menus' | 'tables' | 'reservations' | 'chats' | 'audit';

interface Props {
    adminUser: User;
    activeNav: AdminActiveNav;
    unreadChatCount?: number;
    metrics?: {
        activeOrders?: number;
        totalOrders?: number;
        totalMenus?: number;
        occupiedTables?: number;
        totalTables?: number;
        pendingReservations?: number;
        totalReservations?: number;
    };
    onTabSelect?: (tab: string) => void;
}

export default function AdminSidebar({
    adminUser,
    activeNav,
    unreadChatCount = 0,
    metrics = {},
    onTabSelect
}: Props) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleNavClick = (tabKey: string, href: string) => {
        setIsMobileOpen(false);
        if (onTabSelect) {
            onTabSelect(tabKey);
        } else {
            router.visit(href);
        }
    };

    const navCls = (key: AdminActiveNav) =>
        `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeNav === key
                ? 'bg-[#32151F] text-[#D4B886] font-bold border border-[#B99A65]/40 shadow-xs'
                : 'text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18]'
        }`;

    return (
        <>
            {/* Mobile Header Bar Toggle */}
            <div className="md:hidden sticky top-0 z-40 bg-[#161312] border-b border-[#241F1D] px-4 py-3 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(true)}
                    className="p-1.5 rounded-lg text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
                <img 
                    src="/images/nusara-logo.png" 
                    alt="NUSARA Logo" 
                    className="h-7 w-auto object-contain" 
                />
                <span className="text-[10px] uppercase font-bold text-[#D4B886] px-2 py-0.5 rounded bg-[#32151F]">
                    Admin
                </span>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Main Sidebar (App Shell 4 Specification) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[#161312] border-r border-[#241F1D] flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 shrink-0
                ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex flex-col h-full overflow-y-auto scrollbar-none">
                    {/* Top Identity Block */}
                    <div className="p-4 border-b border-[#241F1D] flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-2.5">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA — Nusantara & Rasa" 
                                className="h-8 w-auto object-contain drop-shadow" 
                            />
                            <div className="leading-tight">
                                <span className="px-2 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[9px] font-bold text-[#D4B886] tracking-wider uppercase block">
                                    Executive Desk
                                </span>
                            </div>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="md:hidden p-1.5 rounded-lg text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Groups */}
                    <div className="p-3 space-y-6 flex-1">
                        {/* Group 1: Operasional Utama */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Operasional
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button
                                    type="button"
                                    onClick={() => handleNavClick('overview', '/admin?tab=overview')}
                                    className={navCls('overview')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <LayoutDashboard className="w-4 h-4 text-[#B99A65]" />
                                        <span>Ikhtisar & Tren</span>
                                    </div>
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeNav === 'overview' ? 'opacity-100' : 'opacity-0'}`} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleNavClick('orders', '/admin?tab=orders')}
                                    className={navCls('orders')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className="w-4 h-4 text-[#B99A65]" />
                                        <span>Antrean Pesanan</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        (metrics.activeOrders ?? 0) > 0
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'text-[#9E938B]'
                                    }`}>
                                        {(metrics.activeOrders ?? 0) > 0 ? metrics.activeOrders : (metrics.totalOrders ?? 0)}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleNavClick('menus', '/admin?tab=menus')}
                                    className={navCls('menus')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <UtensilsCrossed className="w-4 h-4 text-[#B99A65]" />
                                        <span>Katalog & Stok</span>
                                    </div>
                                    <span className="text-[10px] text-[#9E938B] font-mono">
                                        {metrics.totalMenus ?? ''}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleNavClick('tables', '/admin?tab=tables')}
                                    className={navCls('tables')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <QrCode className="w-4 h-4 text-[#B99A65]" />
                                        <span>Meja & Sesi QR</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                        {metrics.occupiedTables ?? 0}/{metrics.totalTables ?? 10}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Group 2: Layanan & Tamu */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Layanan & Tamu
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button
                                    type="button"
                                    onClick={() => handleNavClick('reservations', '/admin?tab=reservations')}
                                    className={navCls('reservations')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-[#B99A65]" />
                                        <span>Jadwal Reservasi</span>
                                    </div>
                                    {(metrics.pendingReservations ?? 0) > 0 ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                                            {metrics.pendingReservations}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-[#9E938B] font-mono">
                                            {metrics.totalReservations ?? ''}
                                        </span>
                                    )}
                                </button>

                                <Link
                                    href="/admin/chats"
                                    className={navCls('chats')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <MessageSquare className="w-4 h-4 text-[#B99A65]" />
                                        <span>Konsierge / Chat</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {unreadChatCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                                                {unreadChatCount} baru
                                            </span>
                                        )}
                                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                    </div>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => handleNavClick('audit', '/admin?tab=audit')}
                                    className={navCls('audit')}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <History className="w-4 h-4 text-[#B99A65]" />
                                        <span>Audit Log</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Group 3: Navigasi Cepat Antar Role */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Navigasi Cepat
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <Link
                                    href="/cashier"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <CreditCard className="w-4 h-4 text-[#B99A65]" />
                                        <span>Halaman Kasir POS</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>

                                <Link
                                    href="/waiter"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Utensils className="w-4 h-4 text-[#B99A65]" />
                                        <span>Halaman Waiter</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>

                                <Link
                                    href="/order"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <UtensilsCrossed className="w-4 h-4 text-[#B99A65]" />
                                        <span>Menu Dine-In Order</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Admin User & Logout */}
                    <div className="p-3 border-t border-[#241F1D]">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E1A18] border border-[#2A2421]">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B99A65] to-[#8C6B38] text-[#110F0E] font-bold text-xs flex items-center justify-center shrink-0">
                                    {adminUser.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{adminUser.name}</p>
                                    <p className="text-[10px] text-[#9E938B] truncate font-mono">{adminUser.email}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="p-1.5 rounded-lg text-[#9E938B] hover:text-rose-400 hover:bg-[#2A2421] transition-colors"
                                title="Keluar dari sesi Admin"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Admin Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                userName={adminUser.name}
                userRole="Administrator"
                customNotice="Pastikan seluruh verifikasi reservasi dan pesanan aktif telah disimpan sebelum mengakhiri sesi Admin."
            />
        </>
    );
}
