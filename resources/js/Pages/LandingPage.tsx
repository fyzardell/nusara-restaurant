import React, { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import MenuCard from '../Components/MenuCard';
import ExperienceCard from '../Components/ExperienceCard';
import ReservationModal from '../Components/ReservationModal';
import OrderTypeModal from '../Components/OrderTypeModal';
import FavoriteLoginPromptModal from '../Components/FavoriteLoginPromptModal';
import NusaraSplashScreen from '../Components/NusaraSplashScreen';
import FlashToast from '../Components/FlashToast';
import { 
    RestaurantSettings, 
    Category, 
    Menu, 
    DiningExperience, 
    OperatingHour,
    User 
} from '../types';
import { 
    Sparkles, 
    Calendar, 
    QrCode, 
    ShoppingBag, 
    Search, 
    Flame, 
    Award, 
    Compass, 
    Clock, 
    MapPin, 
    Phone, 
    CheckCircle2, 
    ArrowRight,
    Utensils,
    HeartHandshake,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react';

interface Props {
    settings: RestaurantSettings;
    categories: Category[];
    menus: Menu[];
    experiences: DiningExperience[];
    operatingHours: OperatingHour[];
}

export default function LandingPage({ settings, categories, menus, experiences, operatingHours }: Props) {
    const { auth, flash } = usePage<{ auth: { user: User | null }; flash: { success?: string; error?: string } }>().props;

    // Modals state
    const [reservationModalOpen, setReservationModalOpen] = useState(false);
    const [orderTypeModalOpen, setOrderTypeModalOpen] = useState(false);
    const [favoritePromptMenu, setFavoritePromptMenu] = useState<Menu | null>(null);
    const [selectedExperience, setSelectedExperience] = useState<DiningExperience | null>(null);
    const [sidePanelOpen, setSidePanelOpen] = useState<boolean>(false);
    const [splashFading, setSplashFading] = useState<boolean>(false);
    const [showSplash, setShowSplash] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('nosplash') === '1') {
                return false;
            }
        }
        return true;
    });

    const handleSplashFinish = () => {
        setSplashFading(true);
        setTimeout(() => {
            setShowSplash(false);
            setSplashFading(false);
        }, 500);
    };

    // Filter & Search state for menus
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [onlyBestSeller, setOnlyBestSeller] = useState<boolean>(false);

    // Simulated local favorites state
    const [favoriteMenuIds, setFavoriteMenuIds] = useState<number[]>([1, 2]);

    // Handle favorite toggle
    const handleToggleFavorite = (menu: Menu) => {
        if (!auth?.user) {
            setFavoritePromptMenu(menu);
            return;
        }

        setFavoriteMenuIds(prev => 
            prev.includes(menu.id) ? prev.filter(id => id !== menu.id) : [...prev, menu.id]
        );
    };

    // Filtered menus
    const filteredMenus = useMemo(() => {
        return menus.filter(menu => {
            const matchesCategory = selectedCategory === 'all' || menu.category_slug === selectedCategory;
            const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  menu.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBestSeller = !onlyBestSeller || menu.is_best_seller;
            return matchesCategory && matchesSearch && matchesBestSeller;
        });
    }, [menus, selectedCategory, searchQuery, onlyBestSeller]);

    const handleSelectDineIn = (tableNum: string) => {
        setOrderTypeModalOpen(false);
        const element = document.getElementById('menu');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        alert(`Simulasi Sesi Meja: Anda memilih Meja ${tableNum}. Sesuai PRD NUSARA, waiter akan memvalidasi meja sebelum pesanan dikirim ke dapur.`);
    };

    const handleSelectTakeaway = () => {
        setOrderTypeModalOpen(false);
        const element = document.getElementById('menu');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#F4EFE6] text-[#211D1B] font-body selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="NUSARA — Harmoni Gastronomi Nusantara Berbalut Kemewahan" />

            <Navbar 
                sidePanelOpen={sidePanelOpen}
                onToggleSidePanel={() => setSidePanelOpen(prev => !prev)}
                onCloseSidePanel={() => setSidePanelOpen(false)}
                onOpenReservation={() => {
                    setSelectedExperience(null);
                    setReservationModalOpen(true);
                }}
                onOpenOrderType={() => setOrderTypeModalOpen(true)}
                onSelectDineIn={() => setOrderTypeModalOpen(true)}
                onSelectTakeaway={() => setOrderTypeModalOpen(true)}
                onReplaySplash={() => setShowSplash(true)}
            />

            {/* Splashscreen Animation Overlay (Plays first on visit or manual trigger) */}
            {showSplash && (
                <div className={`fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-500 ${
                    splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}>
                    <NusaraSplashScreen 
                        autoTransition={true}
                        autoTransitionDelayMs={8200}
                        showControls={true}
                        onFinish={handleSplashFinish}
                    />
                </div>
            )}

            {/* Flash Success Notification (3 Detik Auto Dismiss) */}
            <FlashToast flash={flash} durationMs={3000} />

            {/* Main Page Body */}
            <div className="transition-all duration-300 ease-in-out">
                {/* ========================================================
                    1. HERO SECTION
                ======================================================== */}
            <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#211D1B]">
                {/* Background Atmosphere Image (Warna hitam ditingkatkan sedikit & ada gradien burgundy elegan) */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2000&q=85" 
                        alt="NUSARA Dining Experience"
                        className="w-full h-full object-cover object-center opacity-50 scale-105 transition-transform duration-1000 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#211D1B] via-[#32151F]/55 to-[#211D1B]/50" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#32151F]/30 via-black/40 to-[#211D1B]/90" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 mt-12 md:mt-6">
                    {/* Majestic Headline */}
                    <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#F4EFE6] leading-[1.08] drop-shadow-2xl">
                        Harmoni Rasa Nusantara <br className="hidden sm:inline" />
                        <span className="italic font-normal text-[#D4B886] drop-shadow-lg">Dalam Kemewahan Kontemporer</span>
                    </h1>

                    {/* Hero CTAs: Sesuai instruksi: HANYA ada "Pilih Menu" dan "Reservasi" */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 flex-wrap">
                        {/* 1. Pilih Menu */}
                        <a
                            href="#menu"
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#B99A65]/25 flex items-center justify-center gap-2"
                        >
                            <Utensils className="w-4 h-4 text-[#211D1B]" />
                            <span>Pilih Menu</span>
                        </a>

                        {/* 2. Reservasi */}
                        <button
                            onClick={() => {
                                setSelectedExperience(null);
                                setReservationModalOpen(true);
                            }}
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#32151F]/90 border border-[#B99A65]/60 text-[#F4EFE6] font-semibold text-xs uppercase tracking-widest hover:bg-[#B99A65] hover:text-[#211D1B] hover:border-[#D4B886] transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                        >
                            <Calendar className="w-4 h-4 text-[#D4B886]" />
                            <span>Reservasi</span>
                        </button>
                    </div>

                    {/* Value Pillars Highlights */}
                    <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#32151F]/80 max-w-4xl mx-auto text-left">
                        <div className="p-3 rounded-xl bg-[#32151F]/40 border border-[#B99A65]/15">
                            <span className="text-[10px] uppercase font-bold text-[#B99A65] block">Signature</span>
                            <p className="text-xs font-semibold text-[#F4EFE6] mt-0.5">Wagyu 48-Hour Rendang</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#32151F]/40 border border-[#B99A65]/15">
                            <span className="text-[10px] uppercase font-bold text-[#B99A65] block">Location</span>
                            <p className="text-xs font-semibold text-[#F4EFE6] mt-0.5">Single Branch Senopati</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#32151F]/40 border border-[#B99A65]/15">
                            <span className="text-[10px] uppercase font-bold text-[#B99A65] block">Dine-in System</span>
                            <p className="text-xs font-semibold text-[#F4EFE6] mt-0.5">QR Meja Tanpa Login</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#32151F]/40 border border-[#B99A65]/15">
                            <span className="text-[10px] uppercase font-bold text-[#B99A65] block">Chef Experience</span>
                            <p className="text-xs font-semibold text-[#F4EFE6] mt-0.5">Royal Rijsttafel 12 Rasa</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================
                2. CERITA & FILOSOFI NUSARA (ABOUT SNIPPET)
            ======================================================== */}
            <section id="cerita" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Visual Imagery */}
                    <div className="lg:col-span-5 relative">
                        <div className="relative rounded-3xl overflow-hidden border border-[#B99A65]/40 shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1000&q=80"
                                alt="Chef Preparing Indonesian Dish"
                                className="w-full h-[450px] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#211D1B] via-transparent to-transparent" />
                        </div>
                        {/* Floating Experience Badge */}
                        <div className="absolute -bottom-6 -right-6 p-5 rounded-2xl bg-[#32151F] border border-[#B99A65] text-[#F4EFE6] shadow-2xl max-w-xs hidden sm:block">
                            <div className="flex items-center gap-2 text-[#D4B886] mb-1">
                                <Award className="w-4 h-4" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Pusaka Kuliner</span>
                            </div>
                            <p className="text-xs text-[#F4EFE6]/80 leading-snug">
                                Resep warisan leluhur yang disempurnakan dengan standar hospitality internasional.
                            </p>
                        </div>
                    </div>

                    {/* Narrative Description */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-[#B99A65]">
                            <Compass className="w-4 h-4" />
                            <span>Kisah & Filosofi Kami</span>
                        </div>

                        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#211D1B] leading-tight">
                            Menemukan Kembali Keagungan <br />
                            <span className="italic text-[#32151F]">Cita Rasa Asli Nusantara</span>
                        </h2>

                        <p className="text-sm md:text-base text-[#211D1B]/80 leading-relaxed font-normal">
                            NUSARA lahir dari kerinduan mendalam akan cita rasa masakan rumah dan perjamuan keraton tempo doeloe. Kami berkelana menembus kepulauan Indonesia—dari tanah Minangkabau yang kaya rempah kluwek dan santan tua, pesisir Bali dengan harum base genep bambu, hingga tanah Jawa dengan kelembutan kuah rawon yang berkaramel pekat.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                            <div className="p-4 rounded-2xl bg-[#E8DFCF]/60 border border-[#B99A65]/30">
                                <Flame className="w-5 h-5 text-[#32151F] mb-2" />
                                <h4 className="font-heading text-lg font-bold text-[#32151F]">Bakar Arang Tradisi</h4>
                                <p className="text-xs text-[#211D1B]/70 mt-1">Menggunakan arang batok kelapa & kayu rambutan pilihan.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#E8DFCF]/60 border border-[#B99A65]/30">
                                <Clock className="w-5 h-5 text-[#32151F] mb-2" />
                                <h4 className="font-heading text-lg font-bold text-[#32151F]">Slow Cooking 48h</h4>
                                <p className="text-xs text-[#211D1B]/70 mt-1">Proses memasak berhari-hari demi tekstur lumer sempurna.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#E8DFCF]/60 border border-[#B99A65]/30">
                                <HeartHandshake className="w-5 h-5 text-[#32151F] mb-2" />
                                <h4 className="font-heading text-lg font-bold text-[#32151F]">Keramahan Luhur</h4>
                                <p className="text-xs text-[#211D1B]/70 mt-1">Setiap tamu dilayani layaknya sahabat agung di kediaman kami.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================
                3. PUSAKA MENU & BEST SELLER SHOWCASE
            ======================================================== */}
            <section id="menu" className="py-24 bg-[#211D1B] text-[#F4EFE6] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#32151F] border border-[#B99A65]/30 text-[#D4B886] text-xs font-semibold uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Koleksi Gastronomi Unggulan</span>
                        </div>
                        <h2 className="font-heading text-3xl sm:text-5xl font-bold text-[#F4EFE6]">
                            Pusaka Menu & Best Seller
                        </h2>
                        <p className="text-xs sm:text-sm text-[#F4EFE6]/70 leading-relaxed">
                            Berdasarkan PRD NUSARA, menu Best Seller dihitung dari volume pesanan tertinggi. Menu yang habis tetap ditampilkan secara transparan dengan status redup agar pelanggan mendapatkan informasi ketersediaan yang akurat.
                        </p>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="space-y-6 mb-10">
                        {/* Search and Best Seller Toggle */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-96">
                                <Search className="w-4 h-4 text-[#B99A65] absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari menu (misal: Wagyu, Bebek, Rawon)..."
                                    className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#32151F]/90 border border-[#B99A65]/40 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/40 focus:outline-none focus:border-[#D4B886]"
                                />
                            </div>

                            {/* Best Seller Toggle Button (Tanpa Icon Bintang) */}
                            <button
                                onClick={() => setOnlyBestSeller(!onlyBestSeller)}
                                className={`px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-2 transition-all ${
                                    onlyBestSeller
                                        ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold shadow-lg'
                                        : 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40 hover:border-[#D4B886]'
                                }`}
                            >
                                <span>{onlyBestSeller ? 'Menampilkan: Khusus Best Seller' : 'Filter: Tampilkan Best Seller Saja'}</span>
                            </button>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-[#B99A65] text-[#211D1B] font-bold shadow-md'
                                        : 'bg-[#32151F]/70 text-[#F4EFE6]/70 hover:text-[#F4EFE6] border border-[#B99A65]/20'
                                }`}
                            >
                                Semua Menu ({menus.length})
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.slug)}
                                    className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                        selectedCategory === cat.slug
                                            ? 'bg-[#B99A65] text-[#211D1B] font-bold shadow-md'
                                            : 'bg-[#32151F]/70 text-[#F4EFE6]/70 hover:text-[#F4EFE6] border border-[#B99A65]/20'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Menu Cards Grid */}
                    {filteredMenus.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMenus.map((menu) => (
                                <MenuCard
                                    key={menu.id}
                                    menu={menu}
                                    isFavorite={favoriteMenuIds.includes(menu.id)}
                                    onToggleFavorite={handleToggleFavorite}
                                    onAddToCart={() => setOrderTypeModalOpen(true)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-[#32151F]/30 rounded-3xl border border-[#B99A65]/20">
                            <Utensils className="w-12 h-12 text-[#B99A65] mx-auto mb-3 opacity-60" />
                            <h3 className="font-heading text-xl font-bold text-[#F4EFE6]">
                                Tidak Ada Menu yang Sesuai
                            </h3>
                            <p className="text-xs text-[#F4EFE6]/60 mt-1">
                                Coba ubah kata kunci pencarian atau reset filter kategori Anda.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setOnlyBestSeller(false);
                                }}
                                className="mt-4 px-4 py-2 rounded-full bg-[#B99A65] text-[#211D1B] text-xs font-semibold"
                            >
                                Reset Pencarian
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ========================================================
                4. DINING EXPERIENCES (RIJSTTAFEL & CHEF'S TABLE)
            ======================================================== */}
            <section id="pengalaman" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                    <h2 className="font-heading text-3xl sm:text-5xl font-bold text-[#211D1B]">
                        Dining Experience Nusantara
                    </h2>
                    <p className="text-xs sm:text-sm text-[#211D1B]/75 leading-relaxed">
                        Dirancang untuk perayaan istimewa, jamuan agung bersama relasi terhormat, atau eksplorasi rasa pribadi yang dipandu langsung oleh Executive Chef kami.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {experiences.map((exp) => (
                        <ExperienceCard
                            key={exp.id}
                            experience={exp}
                            onSelectExperience={(selected) => {
                                setSelectedExperience(selected);
                                setReservationModalOpen(true);
                            }}
                        />
                    ))}
                </div>
            </section>

            {/* ========================================================
                5. HOW ORDERING WORKS (PRD SECTION 4: DINE-IN VS TAKEAWAY)
            ======================================================== */}
            <section id="alur-pesan" className="py-24 bg-[#E8DFCF]/50 border-y border-[#B99A65]/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#32151F]">
                            Standard Operating Procedure
                        </span>
                        <h2 className="font-heading text-3xl sm:text-5xl font-bold text-[#211D1B]">
                            Alur Pemesanan di NUSARA
                        </h2>
                        <p className="text-xs sm:text-sm text-[#211D1B]/75 leading-relaxed">
                            Dikelola melalui antrean terpusat (Centralized Order Queue) demi menjaga ketepatan waktu saji dan menghindari bentrok penggunaan meja.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Dine-in Workflow Card */}
                        <div className="p-8 rounded-3xl bg-[#F4EFE6] border border-[#B99A65]/40 shadow-xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#32151F] text-[#D4B886] flex items-center justify-center shadow-lg">
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                        Dine-in via QR Meja
                                    </h3>
                                    <p className="text-xs text-[#211D1B]/70">Pemesanan mandiri tanpa antre di kasir</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#B99A65] text-[#211D1B] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Pindai QR Meja</h5>
                                        <p className="text-xs text-[#211D1B]/70">Pelanggan scan QR code di meja. Sistem membuka sesi pending validation tanpa wajib login.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#B99A65] text-[#211D1B] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Validasi Okupansi Waiter</h5>
                                        <p className="text-xs text-[#211D1B]/70">Waiter mengonfirmasi meja benar ditempati, sesi menjadi Open, dan menu dapat dicheckout.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#B99A65] text-[#211D1B] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Pembayaran & Dapur Memasak</h5>
                                        <p className="text-xs text-[#211D1B]/70">Bayar online (QRIS/Transfer) atau Tunai di kasir. Kasir konfirmasi order ke dapur.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#B99A65] text-[#211D1B] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Penyajian (Served) & Pembersihan</h5>
                                        <p className="text-xs text-[#211D1B]/70">Waiter menyajikan hidangan. Saat selesai, waiter membersihkan meja dan menutup sesi.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setOrderTypeModalOpen(true)}
                                className="w-full py-3 rounded-xl bg-[#32151F] text-[#D4B886] font-semibold text-xs tracking-wider uppercase hover:bg-[#211D1B] transition-colors"
                            >
                                Simulasi Dine-in QR Meja
                            </button>
                        </div>

                        {/* Takeaway Workflow Card */}
                        <div className="p-8 rounded-3xl bg-[#F4EFE6] border border-[#B99A65]/40 shadow-xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#B99A65] text-[#211D1B] flex items-center justify-center shadow-lg">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                        Takeaway (Self-Pickup)
                                    </h3>
                                    <p className="text-xs text-[#211D1B]/70">Pesan dari rumah, ambil hangat di restoran</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Pilih Menu & Checkout</h5>
                                        <p className="text-xs text-[#211D1B]/70">Pilih menu favorit tanpa memilih meja. Masukkan nama & nomor WhatsApp kontak.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Pembayaran Terverifikasi</h5>
                                        <p className="text-xs text-[#211D1B]/70">Pembayaran online diverifikasi instan melalui payment gateway Midtrans.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Dapur Menyiapkan (Preparing)</h5>
                                        <p className="text-xs text-[#211D1B]/70">Kasir mengonfirmasi pesanan. Dapur memasak dengan packaging ramah lingkungan.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                                    <div>
                                        <h5 className="font-bold text-xs text-[#211D1B]">Pengambilan di Kasir (Picked Up)</h5>
                                        <p className="text-xs text-[#211D1B]/70">Pelanggan datang, kasir memverifikasi Order Code, dan menyerahkan makanan.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setOrderTypeModalOpen(true)}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs tracking-wider uppercase hover:shadow-lg transition-all"
                            >
                                Pesan Menu Takeaway
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================
                6. OPERATING HOURS, RESERVATION BANNER & CONTACT
            ======================================================== */}
            <section id="kontak" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="rounded-3xl bg-[#32151F] text-[#F4EFE6] border border-[#B99A65]/40 overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 sm:p-12 items-center">
                        <div className="lg:col-span-7 space-y-5">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886]">
                                Jamuan & Pertemuan Istimewa
                            </span>
                            <h2 className="font-heading text-3xl sm:text-5xl font-bold leading-tight">
                                Pastikan Meja Anda Tersedia <br />
                                <span className="italic text-[#D4B886]">Di Hari & Jam Pilihan</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-[#F4EFE6]/80 leading-relaxed max-w-xl">
                                NUSARA menerapkan batas reservasi maksimal agar kualitas layanan tetap terjaga. Hubungi tim konsierge kami atau ajukan permohonan reservasi secara online.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <button
                                    onClick={() => {
                                        setSelectedExperience(null);
                                        setReservationModalOpen(true);
                                    }}
                                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#B99A65]/20 flex items-center justify-center gap-2"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Formulir Reservasi Online</span>
                                </button>

                                <a
                                    href="tel:+622155678900"
                                    className="px-6 py-3.5 rounded-full border border-[#B99A65]/60 text-[#F4EFE6] text-xs font-semibold hover:bg-[#B99A65]/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4 text-[#D4B886]" />
                                    <span>Konsierge: +62 21 5567 8900</span>
                                </a>
                            </div>
                        </div>

                        {/* Schedule Table Preview */}
                        <div className="lg:col-span-5 bg-[#211D1B]/90 p-6 rounded-2xl border border-[#B99A65]/30 space-y-3">
                            <div className="flex items-center gap-2 text-[#D4B886] text-xs uppercase font-bold tracking-wider mb-2">
                                <Clock className="w-4 h-4" />
                                <span>Jadwal Operasional Restoran</span>
                            </div>

                            <div className="space-y-2 text-xs">
                                {operatingHours && operatingHours.length > 0 ? (
                                    operatingHours.map((oh) => (
                                        <div key={oh.id} className="flex justify-between items-center py-1 border-b border-[#32151F]/80">
                                            <span className="text-[#F4EFE6]/70">{oh.day_name}</span>
                                            <span className="font-semibold text-[#F4EFE6]">
                                                {oh.is_closed ? 'Tutup' : `${oh.open_time.slice(0, 5)} – ${oh.close_time.slice(0, 5)} WIB`}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-[#F4EFE6]/70">Senin - Minggu: 11:00 - 22:30 WIB</div>
                                )}
                            </div>

                            <div className="pt-3 text-[11px] text-[#D4B886] flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer settings={settings} operatingHours={operatingHours} />
            </div>

            {/* Interactive Modals */}
            <ReservationModal
                isOpen={reservationModalOpen}
                onClose={() => setReservationModalOpen(false)}
                experiences={experiences}
                selectedExperience={selectedExperience}
            />

            <OrderTypeModal
                isOpen={orderTypeModalOpen}
                onClose={() => setOrderTypeModalOpen(false)}
                onSelectDineIn={handleSelectDineIn}
                onSelectTakeaway={handleSelectTakeaway}
            />

            <FavoriteLoginPromptModal
                isOpen={!!favoritePromptMenu}
                onClose={() => setFavoritePromptMenu(null)}
                menu={favoritePromptMenu}
            />
        </div>
    );
}
