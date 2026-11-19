import React from 'react';
import { DiningExperience } from '../types';
import { Clock, Users, ArrowUpRight, Sparkles } from 'lucide-react';

interface Props {
    experience: DiningExperience;
    onSelectExperience: (exp: DiningExperience) => void;
}

export default function ExperienceCard({ experience, onSelectExperience }: Props) {
    const formatRupiah = (val: number | null) => {
        if (!val) return 'Hubungi Konsierge';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val) + ' / orang';
    };

    return (
        <div className="group relative rounded-3xl overflow-hidden bg-[#211D1B] border border-[#B99A65]/30 hover:border-[#D4B886] transition-all duration-500 flex flex-col justify-between shadow-2xl hover:-translate-y-1.5">
            {/* Background Image with Gradient */}
            <div className="relative h-72 w-full overflow-hidden">
                <img
                    src={experience.image_url}
                    alt={experience.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#211D1B] via-[#211D1B]/50 to-transparent" />
                
                {/* Duration Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211D1B]/90 backdrop-blur-md border border-[#B99A65]/40 text-[#D4B886] text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Durasi {experience.duration_minutes} Menit</span>
                </div>
            </div>

            {/* Content Details */}
            <div className="p-7 -mt-12 relative z-10 flex flex-col flex-grow justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[#B99A65] text-xs uppercase tracking-widest font-semibold mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Curated Indonesian Journey</span>
                    </div>

                    <h3 className="font-heading text-2xl lg:text-3xl font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors leading-tight">
                        {experience.name}
                    </h3>

                    <p className="mt-3 text-xs md:text-sm text-[#F4EFE6]/75 leading-relaxed">
                        {experience.description}
                    </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#32151F] flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#B99A65] block font-medium">
                            Investasi Kuliner
                        </span>
                        <span className="font-heading text-lg md:text-xl font-bold text-[#D4B886]">
                            {formatRupiah(experience.price_per_person)}
                        </span>
                    </div>

                    <button
                        onClick={() => onSelectExperience(experience)}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-[#B99A65]/20 font-sans"
                    >
                        <span>Reservasi Pengalaman</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
