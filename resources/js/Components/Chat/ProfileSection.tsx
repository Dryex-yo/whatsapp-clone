import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Pencil, Check, X, Loader } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import type { User } from '@/types/chat';

interface Props {
    user: User;
    onBack: () => void;
}

type EditingField = 'name' | 'bio' | null;

export const ProfileSection = ({ user: initialUser, onBack }: Props) => {
    const [user, setUser] = useState<User>(initialUser);
    const [editingField, setEditingField] = useState<EditingField>(null);
    const [editValue, setEditValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEditClick = (field: EditingField) => {
        if (field === 'name') {
            setEditValue(user.name);
        } else if (field === 'bio') {
            setEditValue(user.bio || '');
        }
        setEditingField(field);
    };

    const handleCancel = () => {
        setEditingField(null);
        setEditValue('');
        setAvatarPreview(null);
        setSelectedFile(null);
    };

    const handleSave = async () => {
        if (!editingField || !editValue.trim()) {
            handleCancel();
            return;
        }

        setIsSaving(true);
        try {
            const updateData: { name?: string; bio?: string } = {};
            if (editingField === 'name') {
                updateData.name = editValue;
            } else if (editingField === 'bio') {
                updateData.bio = editValue;
            }

            router.patch(`/profile`, updateData, {
                onSuccess: (page) => {
                    if (page.props.auth?.user) {
                        setUser(page.props.auth.user as User);
                    }
                    handleCancel();
                },
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUploadAvatar = async () => {
        if (!selectedFile) return;

        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', selectedFile);

            router.patch(`/profile`, formData, {
                onSuccess: (page) => {
                    if (page.props.auth?.user) {
                        setUser(page.props.auth.user as User);
                    }
                    handleCancel();
                },
            });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

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
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="transition-transform"
                        onClick={onBack}
                    >
                        <ArrowLeft className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
                    </motion.button>
                    <h1 className="text-xl font-medium">Profil</h1>
                </div>
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Foto Profil */}
                <div className="flex justify-center py-8">
                    <motion.div className="relative group cursor-pointer">
                        <div className="w-[200px] h-[200px] rounded-full overflow-hidden shadow-lg">
                            <img 
                                src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=200`} 
                                alt={user.name}
                                className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                            />
                        </div>
                        {/* Overlay Kamera saat Hover */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40 rounded-full"
                            onClick={triggerFileInput}
                        >
                            {isUploadingAvatar ? (
                                <Loader className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 mb-1" />
                                    <span className="text-[10px] uppercase font-medium text-center px-4">Ubah Foto</span>
                                </>
                            )}
                        </motion.div>

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />

                        {/* Upload Button Muncul Ketika Ada Preview */}
                        <AnimatePresence>
                            {avatarPreview && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-16 flex gap-3"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleUploadAvatar}
                                        disabled={isUploadingAvatar}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#005c4b] hover:bg-[#004d3d] rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
                                    >
                                        {isUploadingAvatar ? (
                                            <Loader className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Upload
                                            </>
                                        )}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#374151] hover:bg-[#4b5563] rounded-lg text-sm font-medium text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Batal
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Nama Anda */}
                <motion.div className="bg-[#111b21] px-8 py-4 shadow-sm">
                    <label className="text-sm text-[#008069] mb-4 block">Nama Anda</label>
                    
                    <AnimatePresence mode="wait">
                        {editingField === 'name' ? (
                            <motion.div
                                key="edit-name"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center gap-3"
                            >
                                <input
                                    autoFocus
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 bg-[#202c33] border border-[#005c4b] rounded px-3 py-2 text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                                    placeholder="Masukkan nama Anda"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="p-2 hover:bg-[#1f2937] rounded transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader className="w-5 h-5 text-[#005c4b] animate-spin" />
                                    ) : (
                                        <Check className="w-5 h-5 text-[#005c4b]" />
                                    )}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCancel}
                                    className="p-2 hover:bg-[#1f2937] rounded transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="view-name"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center justify-between border-b border-transparent hover:border-gray-600 pb-2 transition-colors group"
                            >
                                <span className="text-[#e9edef] text-lg">{user.name}</span>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEditClick('name')}
                                    className="p-2 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Pencil className="w-5 h-5 text-[#8696a0] cursor-pointer" />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-[#8696a0] text-sm mt-4 leading-tight">
                        Ini bukan nama pengguna atau PIN Anda. Nama ini akan terlihat oleh kontak WhatsApp Anda.
                    </p>
                </motion.div>

                {/* Info / About */}
                <motion.div className="bg-[#111b21] px-8 py-6 mt-4 shadow-sm">
                    <label className="text-sm text-[#008069] mb-4 block">Info</label>
                    
                    <AnimatePresence mode="wait">
                        {editingField === 'bio' ? (
                            <motion.div
                                key="edit-bio"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-start gap-3"
                            >
                                <textarea
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 bg-[#202c33] border border-[#005c4b] rounded px-3 py-2 text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
                                    rows={3}
                                    placeholder="Masukkan bio Anda"
                                />
                                <div className="flex flex-col gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="p-2 hover:bg-[#1f2937] rounded transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Loader className="w-5 h-5 text-[#005c4b] animate-spin" />
                                        ) : (
                                            <Check className="w-5 h-5 text-[#005c4b]" />
                                        )}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleCancel}
                                        className="p-2 hover:bg-[#1f2937] rounded transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="view-bio"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center justify-between border-b border-transparent hover:border-gray-600 pb-2 transition-colors group"
                            >
                                <span className="text-[#e9edef] text-sm max-w-xs line-clamp-2">{user.bio || 'Ada di sana!'}</span>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleEditClick('bio')}
                                    className="p-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2"
                                >
                                    <Pencil className="w-5 h-5 text-[#8696a0] cursor-pointer" />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
};