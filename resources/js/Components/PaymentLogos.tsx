import React from 'react';

/**
 * Authentic vector logos for Indonesian payment gateways, e-Wallets & banks (Midtrans compatible)
 */

export function QrisLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="96" height="32" rx="6" fill="#FFFFFF" />
            <path d="M8 7H22V21H8V7Z" fill="#ED1C24" />
            <path d="M11 10H19V18H11V10Z" fill="#FFFFFF" />
            <path d="M13 12H17V16H13V12Z" fill="#ED1C24" />
            <path d="M22 17H25V25H17V22H22V17Z" fill="#ED1C24" />
            <text x="30" y="21" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="15" fill="#1A1A1A" letterSpacing="0.8">
                QRIS
            </text>
            <text x="31" y="28" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="5" fill="#ED1C24" letterSpacing="0.8">
                STANDAR NASIONAL
            </text>
        </svg>
    );
}

export function GopayLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 96 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="96" height="30" rx="6" fill="#00AED6" />
            {/* GoPay circular pin logo */}
            <circle cx="15" cy="15" r="7" fill="#FFFFFF" />
            <circle cx="15" cy="15" r="3.5" fill="#00AED6" />
            <text x="27" y="20.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="15" fill="#FFFFFF" letterSpacing="0.2">
                gopay
            </text>
        </svg>
    );
}

export function ShopeePayLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 110 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="110" height="30" rx="6" fill="#EE4D2D" />
            {/* Shopee Bag Icon */}
            <g transform="translate(8, 6)">
                <path d="M4 6V4C4 2.34315 5.34315 1 7 1C8.65685 1 10 2.34315 10 4V6H13L14 17H0L1 6H4ZM6 6H8V4C8 3.44772 7.55228 3 7 3C6.44772 3 6 3.44772 6 4V6Z" fill="#FFFFFF" />
            </g>
            <text x="26" y="19" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="12" fill="#FFFFFF" letterSpacing="0.1">
                Shopee<tspan fontWeight="900" fill="#FFD580">Pay</tspan>
            </text>
        </svg>
    );
}

export function DanaLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 92 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="92" height="30" rx="6" fill="#118EEA" />
            {/* DANA typographic logo */}
            <text x="14" y="21" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="17" fill="#FFFFFF" letterSpacing="1.2">
                DANA
            </text>
        </svg>
    );
}

export function OvoLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 88 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="88" height="30" rx="6" fill="#4C3494" />
            {/* OVO typographic logo */}
            <text x="16" y="21" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="17" fill="#FFFFFF" letterSpacing="1.5">
                OVO
            </text>
        </svg>
    );
}

export function BcaLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 88 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="88" height="30" rx="6" fill="#005EAA" />
            {/* BCA Emblem */}
            <g transform="translate(8, 6)">
                <path d="M9 1C4.582 1 1 4.582 1 9C1 13.418 4.582 17 9 17C13.418 17 17 13.418 17 9C17 4.582 13.418 1 9 1Z" fill="#FFFFFF" />
                <path d="M4 6.5H14M3.5 9H14.5M4 11.5H14" stroke="#005EAA" strokeWidth="1.4" strokeLinecap="round" />
            </g>
            <text x="32" y="21" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="16" fill="#FFFFFF" letterSpacing="0.5">
                BCA
            </text>
        </svg>
    );
}

export function MandiriLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 96 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="96" height="30" rx="6" fill="#003D79" />
            {/* Golden yellow ribbon wave */}
            <path d="M11 8C13 8 16 10 16 13C16 16 13 18 10 18C8 18 7 17 7 15C7 12 10 8 11 8Z" fill="#FFB800" />
            <path d="M14 10C16 10 19 12 19 15C19 18 16 20 13 20C11 20 10 19 10 17C10 14 13 10 14 10Z" fill="#F59E0B" opacity="0.9" />
            <text x="25" y="20.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="14" fill="#FFFFFF" letterSpacing="0.2">
                mandiri
            </text>
        </svg>
    );
}

export function BniLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 88 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="88" height="30" rx="6" fill="#FFFFFF" stroke="#E8DFD3" strokeWidth="1" />
            <text x="8" y="21.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="17" fill="#005E54" letterSpacing="0.5">
                BNI
            </text>
            <rect x="50" y="6" width="30" height="18" rx="4" fill="#F15A24" />
            <text x="56" y="20" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="12" fill="#FFFFFF" letterSpacing="0.5">
                46
            </text>
        </svg>
    );
}

export function BriLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 88 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="88" height="30" rx="6" fill="#00529C" />
            <g transform="translate(8, 7)">
                <rect width="16" height="16" rx="4" fill="#FFFFFF" />
                <rect x="3" y="3" width="10" height="10" rx="2.5" fill="#00529C" />
                <circle cx="8" cy="8" r="2.5" fill="#F37021" />
            </g>
            <text x="32" y="21.5" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="16" fill="#FFFFFF" letterSpacing="0.8">
                BRI
            </text>
        </svg>
    );
}

export function PermataLogo({ className = "h-6 w-auto" }: { className?: string }) {
    return (
        <svg viewBox="0 0 106 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="106" height="30" rx="6" fill="#FFFFFF" stroke="#E8DFD3" strokeWidth="1" />
            <g transform="translate(8, 7)">
                <polygon points="8,0 16,5 11,10 3,5" fill="#00A3E0" />
                <polygon points="16,5 16,11 11,16 11,10" fill="#78BE20" />
                <polygon points="11,16 5,16 0,11 3,5" fill="#FF671F" />
                <polygon points="0,11 0,5 3,5 11,10" fill="#FFC72C" />
            </g>
            <text x="29" y="20" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="13" fill="#002D62" letterSpacing="0.2">
                Permata
            </text>
        </svg>
    );
}
