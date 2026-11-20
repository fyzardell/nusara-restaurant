import '../css/app.css';
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import NusaraAssembleLoading from './Components/NusaraAssembleLoading';

const appName = import.meta.env.VITE_APP_NAME || 'NUSARA';

function GlobalInertiaRoot({ App, props }: { App: any; props: any }) {
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const [statusText, setStatusText] = useState<string>('Mengakhiri Sesi & Mengamankan Akun...');
    const isHandlingLogoutRef = useRef<boolean>(false);

    useEffect(() => {
        // Intercept Inertia visit to /logout so it plays the full Assemble loading animation
        const unregisterBefore = router.on('before', (event) => {
            const visit = event.detail.visit;
            const method = (visit.method || 'get').toLowerCase();

            let pathname = '';
            const rawUrl = visit.url;
            if (typeof rawUrl === 'string') {
                try {
                    pathname = new URL(rawUrl, window.location.origin).pathname;
                } catch {
                    pathname = rawUrl;
                }
            } else if (rawUrl instanceof URL) {
                pathname = rawUrl.pathname;
            } else if (rawUrl && typeof rawUrl === 'object') {
                pathname = (rawUrl as any).pathname || (rawUrl as any).href || '';
            }

            const normPath = (pathname || '').replace(/\/+$/, '') || '/';

            if (normPath === '/logout' && method === 'post') {
                if (isHandlingLogoutRef.current) return;
                isHandlingLogoutRef.current = true;

                event.preventDefault();
                setIsLoggingOut(true);
                setStatusText('Mengakhiri Sesi & Mengamankan Akun...');

                const startTime = Date.now();
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

                fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({}),
                })
                    .catch(() => {})
                    .finally(() => {
                        // Biarkan animasi Nusara Assemble menyelesaikan siklus penuh pembentukan logo (~3.8s)
                        const elapsed = Date.now() - startTime;
                        const remaining = Math.max(0, 3800 - elapsed);
                        setTimeout(() => {
                            window.location.href = '/';
                        }, remaining);
                    });
            }
        });

        return () => {
            unregisterBefore();
        };
    }, []);

    return (
        <>
            <App {...props} />
            <NusaraAssembleLoading isOpen={isLoggingOut} statusText={statusText} />
        </>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ) as any,
    setup({ el, App, props }) {
        if (el) {
            const root = createRoot(el);
            root.render(<GlobalInertiaRoot App={App} props={props} />);
        }
    },
    progress: {
        color: '#B99A65',
    },
});
