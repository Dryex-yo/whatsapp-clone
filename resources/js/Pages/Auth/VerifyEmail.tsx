import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        post(route('verification.send'), {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="space-y-6">
                {/* Heading */}
                <div className="auth-form-group text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                        <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Verify Email
                    </h1>
                    <p className="mt-3 text-sm text-gray-600">
                        Thanks for signing up! We've sent you a verification link.
                    </p>
                </div>

                {/* Description */}
                <div className="auth-form-group bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                        Before getting started, please verify your email address by clicking on the link we just emailed to you. If you didn't receive the email, we will gladly send you another.
                    </p>
                </div>

                {/* Status message */}
                {status === 'verification-link-sent' && (
                    <div className="status-message-enter rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 border border-green-200">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            A new verification link has been sent to your email.
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={submit}>
                    <div className="auth-button-enter">
                        <PrimaryButton
                            className="btn-primary-auth w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processing || isSubmitting}
                        >
                            {processing || isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </div>
                            ) : (
                                'Resend Verification Email'
                            )}
                        </PrimaryButton>
                    </div>
                </form>

                {/* Divider */}
                <div className="auth-divider"></div>

                {/* Logout link */}
                <div className="auth-link-enter text-center">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    >
                        Sign out
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
