import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-400/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
            </div>

            {/* Glass effect overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>

            {/* Content */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:py-0">
                {/* Logo */}
                <div className="auth-container-enter mb-8 sm:mb-12">
                    <Link href="/">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full blur-xl opacity-75 animate-pulse"></div>
                                <ApplicationLogo className="relative h-20 w-20 fill-white drop-shadow-lg" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Auth Card */}
                <div className="auth-card-enter w-full overflow-hidden bg-white/95 backdrop-blur-md px-6 py-8 shadow-2xl sm:max-w-md sm:rounded-2xl border border-white/20">
                    {/* Decorative top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    
                    {children}
                </div>

                {/* Bottom accent */}
                <div className="auth-link-enter mt-8 text-center">
                    <p className="text-sm text-white/80">
                        © 2026 WhatsApp Clone. All rights reserved.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
}
