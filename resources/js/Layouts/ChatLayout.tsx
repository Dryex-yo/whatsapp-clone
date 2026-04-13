import React, { PropsWithChildren } from 'react';
import { Search, MoreVertical, MessageSquare, Phone, Video, Paperclip, Smile, Send } from 'lucide-react';

export default function ChatLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex h-screen bg-white dark:bg-[#0b141a] overflow-hidden">
            {/* Sidebar Kiri */}
            <aside className="w-[400px] flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111b21]">
                {/* Header Profil */}
                <header className="h-[60px] flex items-center justify-between px-4 bg-gray-50 dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-full bg-gray-400 overflow-hidden cursor-pointer hover:opacity-90 transition shadow-sm">
                        <img src="https://ui-avatars.com/api/?name=Dery+Supriyadi" alt="Profile" />
                    </div>
                    <div className="flex gap-5 text-gray-600 dark:text-gray-300">
                        <MessageSquare className="w-6 h-6 cursor-pointer hover:text-gray-900 dark:hover:text-white transition" />
                        <MoreVertical className="w-6 h-6 cursor-pointer hover:text-gray-900 dark:hover:text-white transition" />
                    </div>
                </header>

                {/* Search Bar */}
                <div className="p-2 bg-white dark:bg-[#111b21]">
                    <div className="relative flex items-center bg-gray-100 dark:bg-[#202c33] rounded-xl px-3 py-1.5 transition-all focus-within:bg-white dark:focus-within:bg-[#2a3942] shadow-inner">
                        <Search className="w-5 h-5 text-gray-500 mr-3" />
                        <input 
                            type="text" 
                            placeholder="Cari atau mulai chat baru"
                            className="bg-transparent border-none focus:ring-0 text-sm w-full dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* List Chat (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Komponen ChatItem akan di-map di sini nanti */}
                    <div className="flex items-center px-3 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-colors border-b border-gray-200 dark:border-gray-800">
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex-shrink-0 mr-3 overflow-hidden shadow-sm">
                            <img src="https://ui-avatars.com/api/?name=John+Doe" alt="User" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <h3 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 truncate">John Doe</h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">21:45</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5 italic">Mengetik...</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Area Chat Utama (Kanan) */}
            <main className="flex-1 flex flex-col relative bg-gray-50 dark:bg-[#0b141a]">
                {/* Background Pattern (Opsional: Bisa pakai CSS pattern) */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e71a7b32ad7f0167c8847913b.png')]"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}