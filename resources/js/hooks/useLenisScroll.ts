/**
 * useLenisScroll — Smooth inertia scroll powered by Lenis + GSAP RAF ticker.
 * Drop this in any page component that needs buttery smooth scroll.
 *
 * Usage:
 *   import { useLenisScroll } from '../hooks/useLenisScroll';
 *   useLenisScroll(); // call once at the top of your page component
 */
import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useLenisScroll() {
    useEffect(() => {
        // Respect prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (prefersReducedMotion) return;

        const lenis = new Lenis({
            duration: 1.4,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 0.9,
            touchMultiplier: 1.5,
        });

        // Connect Lenis to GSAP ticker for perfect sync
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        // Also feed ScrollTrigger with Lenis scroll position
        lenis.on('scroll', ScrollTrigger.update);

        return () => {
            lenis.destroy();
            gsap.ticker.remove((time) => lenis.raf(time * 1000));
        };
    }, []);
}
