import React from 'react';
import { Link } from '@inertiajs/react';
import { RestaurantSettings, OperatingHour } from '../types';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart, Globe, Share2 } from 'lucide-react';

interface Props {
    settings?: RestaurantSettings;
    operatingHours?: OperatingHour[];
}

export default function Footer({ settings, operatingHours }: Props) {
    return (
        <footer className="bg-[#181413] text-[#F4EFE6] border-t border-[#32151F] relative overflow-hidden">
            {/* Subtle Batik Motif Watermark */}
            <div className="absolute right-0 bottom-0 w-96 h-96 opacity-5 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="currentColor" className="text-[#B99A65]">
                    <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-[#B99A65] bg-[#32151F] flex items-center justify-center text-[#D4B886] font-heading font-bold text-xl shadow-lg">
                                N
                            </div>
                            <div>
                                <span className="font-heading text-2xl font-bold tracking-widest text-[#F4EFE6] block leading-none">
                                    NUSARA
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.25em] text-[#B99A65] font-semibold">
                                    Indonesian Dining
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-[#F4EFE6]/70 leading-relaxed">
                            Restoran modern casual dining yang merayakan kekayaan rempah kepulauan Nusantara dalam balutan elegansi kontemporer dan keramahtamahan luhur Indonesia.
                        </p>

                        <div className="pt-2 flex items-center gap-3 text-[#B99A65]">
                            <a 
                                href={settings?.social_links?.instagram || 'https://instagram.com'} 
                                target="_blank" 
                                rel="noreferrer" 
                                title="Instagram NUSARA"
                                className="w-8 h-8 rounded-full border border-[#B99A65]/40 flex items-center justify-center hover:bg-[#B99A65] hover:text-[#211D1B] transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                            </a>
                            <a 
                                href={settings?.social_links?.facebook || 'https://facebook.com'} 
                                target="_blank" 
                                rel="noreferrer" 
                                title="Media Sosial NUSARA"
                                className="w-8 h-8 rounded-full border border-[#B99A65]/40 flex items-center justify-center hover:bg-[#B99A65] hover:text-[#211D1B] transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-3">
                        <h4 className="font-heading text-lg font-bold text-[#D4B886] tracking-wide">
                            Eksplorasi
                        </h4>
                        <ul className="space-y-2 text-xs text-[#F4EFE6]/80">
                            <li><a href="#cerita" className="hover:text-[#D4B886] transition-colors">Filosofi & Kisah Rasa</a></li>
                            <li><a href="#menu" className="hover:text-[#D4B886] transition-colors">Pusaka Menu & Best Seller</a></li>
                            <li><a href="#pengalaman" className="hover:text-[#D4B886] transition-colors">Royal Rijsttafel & Chef's Table</a></li>
                            <li><a href="#alur-pesan" className="hover:text-[#D4B886] transition-colors">Panduan Dine-in QR & Takeaway</a></li>
                            <li><Link href="/login" className="hover:text-[#D4B886] transition-colors">Portal Staf (Admin, Kasir, Waiter)</Link></li>
                        </ul>
                    </div>

                    {/* Operating Hours */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#D4B886]">
                            <Clock className="w-4 h-4" />
                            <h4 className="font-heading text-lg font-bold tracking-wide">
                                Jam Operasional
                            </h4>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#F4EFE6]/75">
                            <li className="flex justify-between border-b border-[#32151F] pb-1">
                                <span>Senin – Kamis</span>
                                <span className="font-semibold text-white">11:00 – 22:30 WIB</span>
                            </li>
                            <li className="flex justify-between border-b border-[#32151F] pb-1">
                                <span>Jumat</span>
                                <span className="font-semibold text-white">11:00 – 23:00 WIB</span>
                            </li>
                            <li className="flex justify-between border-b border-[#32151F] pb-1">
                                <span>Sabtu</span>
                                <span className="font-semibold text-white">10:30 – 23:30 WIB</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Minggu</span>
                                <span className="font-semibold text-white">10:30 – 22:30 WIB</span>
                            </li>
                        </ul>
                    </div>

                    {/* Location & Contacts */}
                    <div className="space-y-3">
                        <h4 className="font-heading text-lg font-bold text-[#D4B886] tracking-wide">
                            Lokasi & Kontak
                        </h4>
                        <div className="space-y-2.5 text-xs text-[#F4EFE6]/75">
                            <div className="flex items-start gap-2.5">
                                <MapPin className="w-4 h-4 text-[#D4B886] mt-0.5 flex-shrink-0" />
                                <span>{settings?.address || 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190'}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Phone className="w-4 h-4 text-[#D4B886] flex-shrink-0" />
                                <span>{settings?.phone || '+62 21 5567 8900'}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Mail className="w-4 h-4 text-[#D4B886] flex-shrink-0" />
                                <span>{settings?.email || 'concierge@nusara.id'}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="p-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/30 text-[11px] text-[#D4B886] flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                <span>100% Halal Certified Ingredients & Single Branch Authentic</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-[#32151F] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F4EFE6]/50 gap-4">
                    <p>© {new Date().getFullYear()} NUSARA Indonesian Dining Experience. Seluruh Hak Cipta Dilindungi.</p>
                    <div className="flex items-center gap-4 text-[#D4B886]">
                        <span>Baseline PRD & ERD v3.0</span>
                        <span>·</span>
                        <Link href="/login" className="hover:underline">Login Karyawan & Member</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
