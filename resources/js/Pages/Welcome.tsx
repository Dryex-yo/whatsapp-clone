import { Link, Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import BlackHoleBackground from '@/Components/BlackHoleBackground';
import VideoMaskedText from '@/Components/VideoMaskedText';
import GlitchText from '@/Components/GlitchText';
import { motion } from 'framer-motion';

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head title="WA Clone - Elegant Messaging" />

            <BlackHoleBackground>
                {/* --- Navigasi Atas --- */}
                <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 md:px-12">
                    <div className="flex items-center gap-2">
                        <div className="size-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
                            WA<span className="text-cyan-400">Clone</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={route('chat.index')}
                                className="text-white bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full backdrop-blur-md transition-all font-medium border border-white/10"
                            >
                                Buka Chat
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="text-white/80 hover:text-white transition-colors font-medium">
                                    Masuk
                                </Link>
                                <Link href={route('register')} className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-cyan-50 transition-all">
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* --- Konten Utama (Hero Section) --- */}
                <main className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full max-w-5xl"
                    >
                        {/* Efek Video Masked Text untuk Judul */}
                        <div className="relative h-[150px] md:h-[300px] w-full flex items-center justify-center">
                            <VideoMaskedText 
                                src="https://www.w3schools.com/html/mov_bbb.mp4" 
                                fontSize="15"
                                fontWeight="900"
                                fontFamily="sans-serif"
                            >
                                MESSAGING
                            </VideoMaskedText>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 flex flex-wrap justify-center items-center gap-x-1">
                            <span>Tanpa Batas, Lebih</span>
                            <GlitchText 
                                text="Elegan." 
                                speed={0.4} 
                                className="text-3xl md:text-5xl !font-bold !text-cyan-400" 
                            />
                        </h2>

                        <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
                            Selamat datang kembali, <strong>Dery Supriyadi</strong>. 
                            Alat komunikasi masa depan yang dibangun dengan Laravel dan React.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href={auth.user ? route('chat.index') : route('login')}
                                className="w-full sm:w-auto px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-cyan-500/30"
                            >
                                {auth.user ? 'Mulai Percakapan' : 'Mulai Sekarang'}
                            </Link>
                            
                            <button className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all border border-white/10 backdrop-blur-sm">
                                Pelajari Fitur
                            </button>
                        </div>
                    </motion.div>
                </main>

                {/* --- Info Teknis Sederhana --- */}
                <footer className="absolute bottom-8 left-0 right-0 z-20">
                    <div className="flex justify-center gap-6 text-[10px] text-gray-600 font-mono tracking-[0.2em] uppercase">
                        <span>Laravel 11</span>
                        <span>React + Inertia</span>
                        <span>VILT Stack</span>
                    </div>
                </footer>
            </BlackHoleBackground>

            <style dangerouslySetInnerHTML={{ __html: `
                body { background-color: #000 !important; margin: 0; overflow-x: hidden; }
                ::selection { background: rgba(34, 211, 238, 0.3); color: white; }
            ` }} />
        </>
    );
}