import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        post(route('login'), {
            onFinish: () => {
                reset('password');
                setIsSubmitting(false);
            },
            onSuccess: () => router.visit('/chat'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="space-y-6">
                {/* Welcome heading */}
                <div className="auth-form-group text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to your account to continue
                    </p>
                </div>

                {/* Status message */}
                {status && (
                    <div className="status-message-enter rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 border border-green-200">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {status}
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={submit} className="space-y-5">
                    {/* Email field */}
                    <div className="auth-form-group">
                        <InputLabel htmlFor="email" value="Email Address" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="input-focus-effect mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                        {errors.email && (
                            <div className="mt-2 flex items-center text-red-600">
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 16.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                                <InputError message={errors.email} />
                            </div>
                        )}
                    </div>

                    {/* Password field */}
                    <div className="auth-form-group">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="input-focus-effect mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {errors.password && (
                            <div className="mt-2 flex items-center text-red-600">
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 16.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                                <InputError message={errors.password} />
                            </div>
                        )}
                    </div>

                    {/* Remember me */}
                    <div className="auth-form-group flex items-center">
                        <label className="flex items-center cursor-pointer group">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked as any)
                                }
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                            />
                            <span className="ms-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                Remember me
                            </span>
                        </label>
                    </div>

                    {/* Forgot password link */}
                    <div className="auth-form-group flex justify-end">
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-all hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    {/* Submit button */}
                    <div className="auth-button-enter pt-2">
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
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </PrimaryButton>
                    </div>
                </form>

                {/* Divider */}
                <div className="auth-divider"></div>

                {/* Registration section */}
                <div className="auth-link-enter text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        >
                            Create one now
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
