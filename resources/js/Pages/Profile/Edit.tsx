import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User } from '@/types';
import { User as UserIcon, Lock, Trash2, ArrowLeft } from 'lucide-react';

interface Props {
    auth: { user: User };
    mustVerifyEmail: boolean;
    status?: string;
}

export default function Edit({ auth, mustVerifyEmail, status }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4 py-2">
                    <h2 className="text-xl font-semibold leading-tight text-[#e9edef]">
                        Setelan
                    </h2>
                </div>
            }
        >
            <Head title="Setelan" />

            {/* Container Utama dengan gaya WhatsApp Web */}
            <div className="bg-[#0b141a] min-h-[calc(100vh-64px)] flex justify-center py-0 sm:py-6">
                <div className="w-full max-w-[1600px] flex bg-[#111b21] shadow-2xl overflow-hidden sm:rounded-sm border border-gray-800/50">
                    
                    {/* Sidebar Pengaturan (Kiri) - Opsional jika ingin navigasi */}
                    <div className="hidden md:flex w-[350px] border-r border-gray-700 flex-col bg-[#111b21]">
                        <div className="p-6 flex flex-col items-center border-b border-gray-700/50">
                            <div className="w-24 h-24 rounded-full bg-[#202c33] flex items-center justify-center mb-4 overflow-hidden border-2 border-gray-600">
                                {(auth.user as any).profile_photo_url ? (
                                    <img src={(auth.user as any).profile_photo_url} alt={auth.user.name} />
                                ) : (
                                    <UserIcon size={48} className="text-[#8696a0]" />
                                )}
                            </div>
                            <h3 className="text-[#e9edef] text-lg font-medium">{auth.user.name}</h3>
                            <p className="text-[#8696a0] text-sm">{auth.user.email}</p>
                        </div>
                        
                        <nav className="flex-1 overflow-y-auto">
                            <div className="p-4 flex items-center gap-4 bg-[#202c33] text-[#e9edef] cursor-default">
                                <UserIcon size={20} className="text-[#00a884]" />
                                <span>Profil</span>
                            </div>
                            <div className="p-4 flex items-center gap-4 hover:bg-[#202c33] text-[#d1d7db] cursor-pointer transition-colors">
                                <Lock size={20} />
                                <span>Keamanan</span>
                            </div>
                        </nav>
                    </div>

                    {/* Area Detail (Kanan) */}
                    <div className="flex-1 bg-[#0b141a] overflow-y-auto custom-scrollbar">
                        <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                            
                            {/* Section: Profil */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <UserIcon className="text-[#00a884]" size={24} />
                                    <h4 className="text-[#00a884] font-medium uppercase text-sm tracking-wider">Profil Anda</h4>
                                </div>
                                <div className="bg-[#111b21] p-6 rounded-lg border border-gray-800">
                                    <UpdateProfileInformationForm
                                        mustVerifyEmail={mustVerifyEmail}
                                        status={status}
                                        className="max-w-xl"
                                    />
                                </div>
                            </section>

                            {/* Section: Keamanan */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <Lock className="text-[#00a884]" size={24} />
                                    <h4 className="text-[#00a884] font-medium uppercase text-sm tracking-wider">Ubah Kata Sandi</h4>
                                </div>
                                <div className="bg-[#111b21] p-6 rounded-lg border border-gray-800">
                                    <UpdatePasswordForm className="max-w-xl" />
                                </div>
                            </section>

                            {/* Section: Bahaya */}
                            <section className="pb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <Trash2 className="text-red-500" size={24} />
                                    <h4 className="text-red-500 font-medium uppercase text-sm tracking-wider">Hapus Akun</h4>
                                </div>
                                <div className="bg-[#111b21] p-6 rounded-lg border border-red-900/30">
                                    <DeleteUserForm className="max-w-xl" />
                                </div>
                            </section>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}