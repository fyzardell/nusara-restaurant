import React from 'react';
import { Head, Link } from '@inertiajs/react';
import NusaraSplashScreen from '../Components/NusaraSplashScreen';
import { ArrowLeft, Home, ShoppingBag } from 'lucide-react';

export default function SplashScreenPage() {
    return (
        <div className="relative min-h-screen bg-[#0e0d0c] text-[#efe9dd]">
            <Head title="Brand Logo Reveal — NUSARA" />

            {/* Back Bar */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-[#c9a45c]/30 text-xs font-dm tracking-wider text-[#efe9dd] hover:text-[#c9a45c] hover:border-[#c9a45c] transition-all shadow-xl"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Beranda</span>
                </Link>
                <Link
                    href="/order"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#722f37]/80 backdrop-blur-md border border-[#c9a45c]/40 text-xs font-dm tracking-wider text-[#efe9dd] hover:bg-[#722f37] transition-all shadow-xl"
                >
                    <ShoppingBag className="w-4 h-4 text-[#c9a45c]" />
                    <span>Pesan Sekarang</span>
                </Link>
            </div>

            {/* Splash Screen */}
            <NusaraSplashScreen 
                autoDismiss={false}
                showControls={true}
                onFinish={() => {
                    // Do not auto-redirect in standalone preview unless clicked
                }}
            />
        </div>
    );
}
