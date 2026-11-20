import React from 'react';
import { Menu } from '../types';
import { Heart, Sparkles, AlertCircle, Plus, Check } from 'lucide-react';

interface Props {
    menu: Menu;
    isFavorite: boolean;
    onToggleFavorite: (menu: Menu) => void;
    onAddToCart?: (menu: Menu) => void;
}

export default function MenuCard({ menu, isFavorite, onToggleFavorite, onAddToCart }: Props) {
    const isOutOfStock = !menu.is_available || menu.stock_quantity <= 0;

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div 
            className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden transition-all duration-300 border ${
                isOutOfStock 
                    ? 'bg-[#211D1B]/40 border-stone-800/60 opacity-60 grayscale-[40%]' 
                    : 'bg-[#211D1B] border-[#B99A65]/25 hover:border-[#D4B886]/70 hover:shadow-2xl hover:shadow-[#32151F]/40 hover:-translate-y-1'
            }`}
        >
            {/* Image & Badges */}
            <div className="relative h-56 w-full overflow-hidden bg-stone-900">
                <img
                    src={menu.image_path}
                    alt={menu.name}
                    className={`h-full w-full object-cover transition-transform duration-700 ${
                        isOutOfStock ? '' : 'group-hover:scale-110'
                    }`}
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#211D1B] via-transparent to-black/30" />

                {/* Best Seller Badge (Tanpa Icon Bintang) */}
                {menu.is_best_seller && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] text-[11px] font-bold uppercase tracking-wider shadow-md">
                        <span>Best Seller</span>
                    </div>
                )}

                {/* Out of Stock Badge */}
                {isOutOfStock && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-800/90 text-stone-300 border border-stone-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Habis Terjual</span>
                    </div>
                )}

                {/* Category Pill */}
                <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-[#32151F]/90 text-[#D4B886] border border-[#B99A65]/30">
                        {menu.category_name}
                    </span>
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(menu);
                    }}
                    title={isFavorite ? "Hapus dari Favorit" : "Simpan ke Favorit"}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg ${
                        isFavorite 
                            ? 'bg-rose-950/90 text-rose-400 border border-rose-600/50 scale-110' 
                            : 'bg-[#211D1B]/80 text-[#F4EFE6]/70 border border-[#B99A65]/30 hover:text-rose-400 hover:border-rose-400'
                    }`}
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
            </div>

            {/* Content Details */}
            <div className="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <h3 className="font-heading text-xl font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors leading-snug">
                        {menu.name}
                    </h3>
                    <p className="mt-2 text-xs text-[#F4EFE6]/70 line-clamp-3 leading-relaxed">
                        {menu.description}
                    </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#32151F] flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#B99A65] block font-medium">
                            Harga Satuan
                        </span>
                        <span className="font-heading text-xl font-bold text-[#D4B886]">
                            {formatRupiah(menu.price)}
                        </span>
                    </div>

                    {/* Action Button */}
                    {isOutOfStock ? (
                        <button
                            disabled
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50"
                        >
                            Habis
                        </button>
                    ) : (
                        <button
                            onClick={() => onAddToCart?.(menu)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 hover:bg-gradient-to-r hover:from-[#B99A65] hover:to-[#D4B886] hover:text-[#211D1B] transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pilih Menu</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
