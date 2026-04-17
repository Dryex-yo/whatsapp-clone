import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Pencil } from 'lucide-react';
import { User } from '@/types/chat';

interface Props {
    user: User;
    onBack: () => void;
}

export const ProfileSection = ({ user, onBack }: Props) => {
    return (
        <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 flex flex-col bg-[#111b21]"
        >
            {/* Header Profil */}
            <div className="h-[108px] bg-[#202c33] flex items-end px-6 pb-4">
                <div className="flex items-center gap-6 text-[#d1d7db]">
                    <ArrowLeft 
                        className="w-6 h-6 cursor-pointer hover:text-white transition-colors" 
                        onClick={onBack} 
                    />
                    <h1 className="text-xl font-medium">Profil</h1>
                </div>
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Foto Profil */}
                <div className="flex justify-center py-8">
                    <div className="relative group cursor-pointer">
                        <div className="w-[200px] h-[200px] rounded-full overflow-hidden">
                            <img 
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=200`} 
                                alt={user.name}
                                className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                            />
                        </div>
                        {/* Overlay Kamera saat Hover */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 mb-1" />
                            <span className="text-[10px] uppercase font-medium text-center px-4">Ubah Foto Profil</span>
                        </div>
                    </div>
                </div>

                {/* Nama Anda */}
                <div className="bg-[#111b21] px-8 py-4 shadow-sm">
                    <label className="text-sm text-[#008069] mb-4 block">Nama Anda</label>
                    <div className="flex items-center justify-between border-b border-transparent hover:border-gray-600 pb-2 transition-colors group">
                        <span className="text-[#e9edef] text-lg">{user.name}</span>
                        <Pencil className="w-5 h-5 text-[#8696a0] cursor-pointer hidden group-hover:block" />
                    </div>
                    <p className="text-[#8696a0] text-sm mt-4 leading-tight">
                        Ini bukan nama pengguna atau PIN Anda. Nama ini akan terlihat oleh kontak WhatsApp Anda.
                    </p>
                </div>

                {/* Info / About */}
                <div className="bg-[#111b21] px-8 py-6 mt-4 shadow-sm">
                    <label className="text-sm text-[#008069] mb-4 block">Info</label>
                    <div className="flex items-center justify-between border-b border-transparent hover:border-gray-600 pb-2 transition-colors group">
                        <span className="text-[#e9edef]">{user.bio || 'Ada di sana!'}</span>
                        <Pencil className="w-5 h-5 text-[#8696a0] cursor-pointer hidden group-hover:block" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};