import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User } from '@/types';

interface Props {
    auth: { user: User };
    mustVerifyEmail: boolean;
    status?: string;
}

export default function Edit({ auth, mustVerifyEmail, status }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-[#e9edef]">
                    Profile Settings
                </h2>
            }
        >
            <Head title="Profile Settings" />

            <div className="py-12 bg-[#0b141a] min-h-screen">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Bagian Update Informasi Profil */}
                    <div className="bg-[#111b21] p-4 shadow sm:rounded-lg sm:p-8 border border-gray-800">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    {/* Bagian Update Password */}
                    <div className="bg-[#111b21] p-4 shadow sm:rounded-lg sm:p-8 border border-gray-800">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    {/* Bagian Hapus Akun */}
                    <div className="bg-[#111b21] p-4 shadow sm:rounded-lg sm:p-8 border border-gray-800">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}