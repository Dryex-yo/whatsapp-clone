import React from 'react';
import ChatLayout from '@/Layouts/ChatLayout';
import { Head, usePage } from '@inertiajs/react';
import { Video, Phone, MoreVertical, Smile, Paperclip, Send } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Message {
    id: number;
    body: string;
    created_at: string;
}

interface Conversation {
    id: number;
    users: User[];
    last_message?: Message;
}

interface Props {
    conversations: Conversation[];
}

export default function Chat({ conversations }: Props) {
    // Mengambil data user yang sedang login dari shared data Inertia
    const { auth } = usePage<any>().props;

    return (
        <ChatLayout>
            <Head title="WhatsApp Clone" />

            {/* --- SIDEBAR LIST (Dinamis dari Database) --- */}
            {/* Catatan: Kode ini akan merender list chat di area sidebar. 
                Pastikan di ChatLayout.tsx kamu sudah menghapus data statisnya 
                atau membiarkannya kosong agar tidak double.
            */}
            <div slot="sidebar" className="flex-1 overflow-y-auto custom-scrollbar">
                {conversations.map((conv) => {
                    // Cari lawan bicara (user yang ID-nya bukan ID kita)
                    const recipient = conv.users.find((u) => u.id !== auth.user.id);
                    
                    return (
                        <div 
                            key={conv.id}
                            className="flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors border-b border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 mr-3 overflow-hidden shadow-sm">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${recipient?.name}&background=random`} 
                                    alt={recipient?.name} 
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {recipient?.name}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        {conv.last_message 
                                            ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                            : ''}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate mt-0.5">
                                    {conv.last_message?.body || 'Belum ada pesan'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- AREA CHAT AKTIF --- */}
            <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 shadow-sm z-20">
                <div className="flex items-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 shadow-sm">
                        <img src={`https://ui-avatars.com/api/?name=John+Doe`} alt="Active Chat" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold dark:text-white">John Doe</h2>
                        <p className="text-[11px] text-green-500 font-medium">Online</p>
                    </div>
                </div>
                <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                    <Video className="w-5 h-5 cursor-pointer hover:text-gray-700" />
                    <Phone className="w-5 h-5 cursor-pointer hover:text-gray-700" />
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-700" />
                </div>
            </div>

            {/* Area Pesan (Scrollable) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-[#202c33] p-2.5 rounded-2xl rounded-tl-none shadow-sm max-w-[70%] text-sm dark:text-gray-100">
                        Halo Dery! Bagaimana progress Postgres-nya?
                        <span className="text-[10px] text-gray-400 ml-2 float-right mt-1.5">21:40</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="bg-[#dcf8c6] dark:bg-[#005c4b] p-2.5 rounded-2xl rounded-tr-none shadow-sm max-w-[70%] text-sm dark:text-gray-100">
                        Sudah Done semua John, driver pdo_pgsql sudah aktif! 🚀
                        <span className="text-[10px] text-gray-500 dark:text-gray-300 ml-2 float-right mt-1.5">21:42</span>
                    </div>
                </div>
            </div>

            {/* Input Chat */}
            <div className="min-h-[62px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center px-4 py-2 gap-3 z-20">
                <Smile className="w-6 h-6 text-gray-500 cursor-pointer" />
                <Paperclip className="w-6 h-6 text-gray-500 cursor-pointer" />
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Ketik pesan"
                        className="w-full bg-white dark:bg-[#2a3942] border-none rounded-xl px-4 py-2 text-sm focus:ring-0 dark:text-white shadow-sm"
                    />
                </div>
                <button className="bg-[#00a884] p-2 rounded-full text-white hover:bg-[#008f72] transition shadow-md">
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </ChatLayout>
    );
}