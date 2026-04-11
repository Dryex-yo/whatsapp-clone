import React from 'react';
import ChatLayout from '@/Layouts/ChatLayout';
import { Head } from '@inertiajs/react';
// Tambahkan baris import di bawah ini untuk memperbaiki error "Cannot find name"
import { Video, Phone, MoreVertical, Smile, Paperclip, Send } from 'lucide-react';

interface Props {
    conversations: any[]; 
}

export default function Chat({ conversations }: Props) {
    return (
        <ChatLayout>
            <Head title="WhatsApp Clone" />
            
            {/* Header Chat Aktif */}
            <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 shadow-sm">
                        <img src={`https://ui-avatars.com/api/?name=John+Doe`} alt="Active Chat" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold dark:text-white">Dery</h2>
                        <p className="text-[11px] text-green-500 font-medium">Online</p>
                    </div>
                </div>
                {/* Bagian Icon yang sebelumnya error */}
                <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                    <Video className="w-5 h-5 cursor-pointer hover:text-gray-700" />
                    <Phone className="w-5 h-5 cursor-pointer hover:text-gray-700" />
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-700" />
                </div>
            </div>

            {/* Area Pesan */}
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
            <div className="min-h-[62px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center px-4 py-2 gap-3">
                <Smile className="w-6 h-6 text-gray-500 cursor-pointer" />
                <Paperclip className="w-6 h-6 text-gray-500 cursor-pointer" />
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Ketik pesan"
                        className="w-full bg-white dark:bg-[#2a3942] border-none rounded-xl px-4 py-2 text-sm focus:ring-0 dark:text-white"
                    />
                </div>
                <button className="bg-[#00a884] p-2 rounded-full text-white hover:bg-[#008f72] transition shadow-md">
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </ChatLayout>
    );
}