import React, { useEffect, useRef, useState } from 'react';
import { NUSARA_ASSEMBLE_DATA } from './nusaraAssembleData';

interface Props {
    isOpen: boolean;
    statusText?: string;
}

// Direction vector [fromX, fromY, rotationDeg] for 4 tiles clockwise
const FROM = [
    [-460, -340, -26],
    [460, -340, 26],
    [460, 340, -26],
    [-460, 340, 26],
];

// Fallback geometric centers
const FALLBACK_TILE_CENTERS = [
    { cx: 748.25, cy: 196.75 },
    { cx: 1003.75, cy: 195.25 },
    { cx: 1025.25, cy: 464.75 },
    { cx: 770.25, cy: 467.25 },
];

const FALLBACK_TAG_CX = [
    52.75, 191.25, 320.75, 447.75, 584.75, 710.75, 834.75, 966.75, 1091.75, 1314.75, 1530.75, 1656.75, 1784.75, 1912.75,
];

// Easing math
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => {
    const c = clamp(v);
    return c * c * (3 - 2 * c);
};
const expo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
const back = (x: number, s = 2.2) => {
    const c = clamp(x);
    return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2);
};

const T_ALL = 7.4;
const T_EXIT = 6.3;

export default function NusaraAssembleLoading({ isOpen, statusText = 'Memverifikasi Sesi' }: Props) {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const themeRef = useRef(theme);
    themeRef.current = theme;

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Refs for animated elements
    const rootGRef = useRef<SVGGElement>(null);
    const glowCircleRef = useRef<SVGCircleElement>(null);
    const ringCircleRef = useRef<SVGCircleElement>(null);
    const tileGroupsRef = useRef<{ g: SVGGElement; gp: SVGPathElement; cx: number; cy: number; from: number[] }[]>([]);
    const letterPathsRef = useRef<SVGPathElement[]>([]);
    const tagPathsRef = useRef<{ p: SVGPathElement; cx: number }[]>([]);
    const regPathRef = useRef<SVGPathElement>(null);
    const sheenRectRef = useRef<SVGRectElement>(null);
    const dotsRef = useRef<(HTMLSpanElement | null)[]>([]);
    const t0Ref = useRef<number>(0);

    useEffect(() => {
        if (!isOpen) {
            t0Ref.current = 0;
            return;
        }

        // Initialize element centers via getBBox() or static fallbacks
        const tileElements = tileGroupsRef.current;
        tileElements.forEach((tile, i) => {
            if (tile?.g) {
                try {
                    const b = tile.g.getBBox();
                    if (b.width > 0 && b.height > 0) {
                        tile.cx = b.x + b.width / 2;
                        tile.cy = b.y + b.height / 2;
                    }
                } catch {
                    tile.cx = FALLBACK_TILE_CENTERS[i].cx;
                    tile.cy = FALLBACK_TILE_CENTERS[i].cy;
                }
            }
        });

        tagPathsRef.current.forEach((item, i) => {
            if (item?.p) {
                try {
                    const b = item.p.getBBox();
                    if (b.width > 0) {
                        item.cx = b.x + b.width / 2;
                    }
                } catch {
                    item.cx = FALLBACK_TAG_CX[i] || 987;
                }
            }
        });

        let animationFrameId: number;
        let isStopped = false;
        if (t0Ref.current === 0) {
            t0Ref.current = performance.now();
        }
        const prefersReducedMotion = typeof window !== 'undefined' 
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function frame(t: number) {
            const rootG = rootGRef.current;
            if (!rootG) return;

            const fade = 1 - smooth((t - T_EXIT) / 0.8);
            rootG.setAttribute('opacity', fade.toFixed(3));

            // Animate 4 tiles
            tileElements.forEach((o, i) => {
                if (!o?.g || !o?.gp) return;
                const prog = clamp((t - (0.15 + i * 0.2)) / 1.3);
                const e = back(prog);
                const k = 1 - e;
                const s = 0.72 + 0.28 * e;
                o.g.setAttribute(
                    'transform',
                    `translate(${(o.cx + o.from[0] * k).toFixed(1)} ${(o.cy + o.from[1] * k).toFixed(1)}) rotate(${(o.from[2] * k).toFixed(2)}) scale(${s.toFixed(4)}) translate(${-o.cx.toFixed(1)} ${-o.cy.toFixed(1)})`
                );
                o.g.setAttribute('opacity', smooth(prog / 0.22).toFixed(3));
                o.gp.setAttribute('opacity', (1 - smooth((prog - 0.3) / 0.55)).toFixed(3));

                const lit = smooth((prog - 0.28) / 0.1);
                const dot = dotsRef.current[i];
                if (dot) {
                    dot.style.opacity = (0.18 + 0.82 * lit * fade).toFixed(3);
                }
            });

            // Golden expanding ring & radial glow
            const ru = clamp((t - 1.1) / 1.3);
            if (ringCircleRef.current) {
                ringCircleRef.current.setAttribute('r', (60 + 760 * expo(ru)).toFixed(1));
                ringCircleRef.current.setAttribute('opacity', (t > 1.1 && ru < 1 ? (1 - ru) * 0.55 : 0).toFixed(3));
            }
            if (glowCircleRef.current) {
                const glowVal = themeRef.current === 'dark' ? 0.2 : 0.12;
                glowCircleRef.current.setAttribute('opacity', (smooth((t - 1) / 1.2) * glowVal).toFixed(3));
            }

            // NUSARA letters rise from behind baseline
            letterPathsRef.current.forEach((l, i) => {
                if (!l) return;
                const e = expo((t - (1.5 + i * 0.1)) / 1.0);
                l.setAttribute('transform', `translate(0 ${(400 * (1 - e)).toFixed(1)})`);
            });

            // Tagline letters converge horizontally
            tagPathsRef.current.forEach((o, i) => {
                if (!o?.p) return;
                const prog = clamp((t - (2.6 + i * 0.045)) / 1.1);
                const e = expo(prog);
                o.p.setAttribute('transform', `translate(${((o.cx - 987) * 0.35 * (1 - e)).toFixed(1)} 0)`);
                o.p.setAttribute('opacity', smooth(prog / 0.55).toFixed(3));
            });

            // Registered mark ® pops in
            if (regPathRef.current) {
                const rp = clamp((t - 3.9) / 0.9);
                const re = back(rp, 2.6);
                regPathRef.current.setAttribute('transform', `translate(1166 29) scale(${(0.3 + 0.7 * re).toFixed(3)}) translate(-1166 -29)`);
                regPathRef.current.setAttribute('opacity', smooth(rp / 0.3).toFixed(3));
            }

            // Sheen diagonal sweep
            if (sheenRectRef.current) {
                const st = (t - 4.4) / 1.3;
                sheenRectRef.current.setAttribute(
                    'transform',
                    `translate(${st < 0 || st > 1 ? -900 : -300 + st * 2600} 0) skewX(-18)`
                );
            }
        }

        if (prefersReducedMotion) {
            frame(5.9);
        } else {
            const loop = (now: number) => {
                if (isStopped) return;
                frame(((now - t0Ref.current) / 1000) % T_ALL);
                animationFrameId = requestAnimationFrame(loop);
            };
            animationFrameId = requestAnimationFrame(loop);
        }

        return () => {
            isStopped = true;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isDark = theme === 'dark';
    const bg = isDark ? '#0e0d0c' : '#f8f7f4';
    const ink = isDark ? '#efe9dd' : '#221f1c';
    const gold = isDark ? '#d2ad62' : '#b8892f';
    const muted = isDark ? '#8f887b' : '#7a7469';
    const line = isDark ? '#2a2723' : '#dedad2';

    return (
        <aside
            ref={containerRef}
            aria-live="polite"
            aria-busy="true"
            className="fixed inset-0 z-[999999] flex flex-col items-center justify-between transition-colors duration-500 overflow-hidden font-['Jost',sans-serif] select-none"
            style={{
                backgroundColor: bg,
                color: ink,
                paddingTop: 'clamp(16px, 4vh, 40px)',
                paddingBottom: 'clamp(16px, 4vh, 40px)',
            }}
        >
            {/* SVG Stage */}
            <div className="flex-1 w-full flex items-center justify-center min-h-0 px-4 sm:px-8">
                <svg
                    ref={svgRef}
                    viewBox="-30 -30 2020 1404"
                    role="img"
                    aria-label="Memuat logo NUSARA"
                    className="w-full max-w-[760px] h-auto max-h-[70vh] overflow-visible block"
                    style={{
                        filter: isDark ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))' : 'drop-shadow(0 15px 30px rgba(0,0,0,0.1))'
                    }}
                >
                    <defs>
                        {/* Radial Glow */}
                        <radialGradient id="assemble-rg">
                            <stop offset="0" stopColor={gold} stopOpacity="1" />
                            <stop offset="1" stopColor={gold} stopOpacity="0" />
                        </radialGradient>

                        {/* Sheen Gradient */}
                        <linearGradient id="assemble-sg" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0" stopColor="#f3d89a" stopOpacity="0" />
                            <stop offset="0.5" stopColor="#f3d89a" stopOpacity="0.95" />
                            <stop offset="1" stopColor="#f3d89a" stopOpacity="0" />
                        </linearGradient>

                        {/* Baseline Clip for Rising NUSARA Letters */}
                        <clipPath id="assemble-wc">
                            <rect x="-30" y="790" width="2020" height="390" />
                        </clipPath>

                        {/* Mask for Diagonal Sheen Sweep */}
                        <mask
                            id="assemble-lm"
                            maskUnits="userSpaceOnUse"
                            x="-30"
                            y="-30"
                            width="2020"
                            height="1404"
                        >
                            {[...NUSARA_ASSEMBLE_DATA.tiles, ...NUSARA_ASSEMBLE_DATA.letters, ...NUSARA_ASSEMBLE_DATA.tag, NUSARA_ASSEMBLE_DATA.reg].map((d, idx) => (
                                <path key={idx} d={d} fill="#ffffff" fillRule="evenodd" />
                            ))}
                        </mask>
                    </defs>

                    {/* Logo Elements Root */}
                    <g ref={rootGRef}>
                        {/* Ambient Radial Glow */}
                        <circle
                            ref={glowCircleRef}
                            cx="887"
                            cy="331"
                            r="760"
                            fill="url(#assemble-rg)"
                            opacity="0"
                        />

                        {/* Expanding Golden Ring */}
                        <circle
                            ref={ringCircleRef}
                            cx="887"
                            cy="331"
                            r="60"
                            fill="none"
                            stroke={gold}
                            strokeWidth="3"
                            opacity="0"
                        />

                        {/* 4 Icon Tiles Flying In From 4 Corners */}
                        {NUSARA_ASSEMBLE_DATA.tiles.map((tilePath, i) => (
                            <g
                                key={`tile-${i}`}
                                ref={(el) => {
                                    if (el) {
                                        tileGroupsRef.current[i] = {
                                            g: el,
                                            gp: el.querySelector('path.tile-gold') as SVGPathElement,
                                            cx: FALLBACK_TILE_CENTERS[i].cx,
                                            cy: FALLBACK_TILE_CENTERS[i].cy,
                                            from: FROM[i],
                                        };
                                    }
                                }}
                                opacity="0"
                            >
                                <path d={tilePath} fill={ink} fillRule="evenodd" />
                                <path d={tilePath} className="tile-gold" fill={gold} fillRule="evenodd" opacity="0" />
                            </g>
                        ))}

                        {/* NUSARA Typography rising from baseline */}
                        <g clipPath="url(#assemble-wc)">
                            {NUSARA_ASSEMBLE_DATA.letters.map((letterPath, i) => (
                                <path
                                    key={`letter-${i}`}
                                    ref={(el) => {
                                        if (el) letterPathsRef.current[i] = el;
                                    }}
                                    d={letterPath}
                                    fill={ink}
                                    fillRule="evenodd"
                                />
                            ))}
                        </g>

                        {/* Tagline: NUSANTARA & RASA converging horizontally */}
                        {NUSARA_ASSEMBLE_DATA.tag.map((tagPath, i) => (
                            <path
                                key={`tag-${i}`}
                                ref={(el) => {
                                    if (el) {
                                        tagPathsRef.current[i] = {
                                            p: el,
                                            cx: FALLBACK_TAG_CX[i] || 987,
                                        };
                                    }
                                }}
                                d={tagPath}
                                fill={ink}
                                fillRule="evenodd"
                                opacity="0"
                            />
                        ))}

                        {/* Registered Mark ® */}
                        <path
                            ref={regPathRef}
                            d={NUSARA_ASSEMBLE_DATA.reg}
                            fill={ink}
                            fillRule="evenodd"
                            opacity="0"
                        />
                    </g>

                    {/* Sheen Diagonal Sweep Over Logo */}
                    <g mask="url(#assemble-lm)">
                        <rect
                            ref={sheenRectRef}
                            x="-300"
                            y="-60"
                            width="280"
                            height="1500"
                            fill="url(#assemble-sg)"
                            transform="translate(-900 0) skewX(-18)"
                        />
                    </g>
                </svg>
            </div>

            {/* Meta Status Indicator (Memuat + 4 Progressive Dots) */}
            <div
                className="flex items-center gap-4 text-xs font-medium tracking-[0.22em] uppercase mb-4"
                style={{ color: muted }}
                role="status"
            >
                <span>{statusText}</span>
                <span className="flex items-center gap-2">
                    {[0, 1, 2, 3].map((dotIdx) => (
                        <span
                            key={dotIdx}
                            ref={(el) => {
                                dotsRef.current[dotIdx] = el;
                            }}
                            className="w-1.5 h-1.5 rounded-full block transition-opacity duration-150"
                            style={{
                                backgroundColor: gold,
                                opacity: 0.18,
                            }}
                        />
                    ))}
                </span>
            </div>

            {/* Theme Toggle Button (Terang / Gelap) */}
            <div className="flex gap-2.5 justify-center">
                <button
                    type="button"
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all duration-300 hover:scale-105"
                    style={{
                        color: muted,
                        backgroundColor: 'transparent',
                        border: `1px solid ${line}`,
                    }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
                    </svg>
                    <span>Terang / Gelap</span>
                </button>
            </div>
        </aside>
    );
}
