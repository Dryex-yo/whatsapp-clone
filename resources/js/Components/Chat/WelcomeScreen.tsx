import React from 'react';
import { motion } from 'framer-motion';
import { FileText, UserPlus, Sparkles, Lock } from 'lucide-react';

/**
 * Welcome Screen Component
 * Displays when no conversation is selected in the chat window
 * Features modern action cards matching WhatsApp Desktop design
 */
export default function WelcomeScreen() {
    const actionCards = [
        {
            id: 'document',
            icon: FileText,
            label: 'Kirim Dokumen',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            id: 'contact',
            icon: UserPlus,
            label: 'Tambah Kontak',
            color: 'from-purple-500 to-pink-500',
        },
        {
            id: 'meta-ai',
            icon: Sparkles,
            label: 'Tanya Meta AI',
            color: 'from-amber-500 to-orange-500',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-screen bg-[#0b141a] px-4 relative"
        >
            {/* Main Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Pilih percakapan
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        Atau mulai dengan salah satu aksi di bawah
                    </p>
                </motion.div>

                {/* Action Cards Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16"
                >
                    {actionCards.map((card, index) => {
                        const IconComponent = card.icon;
                        return (
                            <motion.button
                                key={card.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ scale: 1.08, y: -8 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex flex-col items-center justify-center p-8 bg-[#202c33] rounded-2xl border border-[#2a3a42] hover:border-[#00a884]/50 transition-all duration-300 group cursor-pointer"
                            >
                                {/* Icon Container with Gradient */}
                                <motion.div
                                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all`}
                                    whileHover={{ rotate: 5 }}
                                >
                                    <IconComponent className="w-10 h-10 text-white" strokeWidth={1.5} />
                                </motion.div>

                                {/* Label */}
                                <p className="text-white font-medium text-center text-sm md:text-base">
                                    {card.label}
                                </p>
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Divider */}
                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="w-full h-px bg-gradient-to-r from-transparent via-[#2a3a42] to-transparent mb-8"
                />

                {/* Info Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-500 text-xs md:text-sm text-center max-w-md"
                >
                    Pilih chat dari daftar di sebelah kiri atau cari kontak untuk memulai percakapan baru
                </motion.p>
            </div>

            {/* Footer Encryption Notice */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-center gap-2 text-gray-600 text-xs pb-6"
            >
                <Lock className="w-3.5 h-3.5 text-[#00a884]" />
                <span>Pesan Anda terenkripsi secara end-to-end</span>
            </motion.div>
        </motion.div>
    );
}
