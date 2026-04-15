import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, Theme } from './contexts/ThemeProvider';
import { NetworkProvider } from './contexts/NetworkContext';
import ErrorBoundary from './Components/ErrorBoundary';
import NetworkBanner from './Components/NetworkBanner';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Get user theme preference from props
        const userTheme = (props.initialPage.props?.auth?.user?.theme as Theme) || 'system';

        root.render(
            <ErrorBoundary>
                <NetworkProvider>
                    <ThemeProvider initialTheme={userTheme}>
                        <NetworkBanner />
                        <App {...props} />
                    </ThemeProvider>
                </NetworkProvider>
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

