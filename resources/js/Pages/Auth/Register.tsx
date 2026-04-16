import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        post(route('register'), {
            onFinish: () => {
                reset('password', 'password_confirmation');
                setIsSubmitting(false);
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="space-y-6">
                {/* Welcome heading */}
                <div className="auth-form-group text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Create Account
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Join WhatsApp Clone today
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="space-y-5">
                    {/* Name field */}
                    <div className="auth-form-group">
                        <InputLabel htmlFor="name" value="Full Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="input-focus-effect mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                        {errors.name && (
                            <div className="mt-2 flex items-center text-red-600">
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 16.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                                <InputError message={errors.name} />
                            </div>
                        )}
                    </div>

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
                            autoComplete="new-password"
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

                    {/* Confirm Password field */}
                    <div className="auth-form-group">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                        />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="input-focus-effect mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="••••••••"
                            required
                        />
                        {errors.password_confirmation && (
                            <div className="mt-2 flex items-center text-red-600">
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 16.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                                <InputError message={errors.password_confirmation} />
                            </div>
                        )}
                    </div>

                    {/* Terms agreement */}
                    <div className="auth-form-group">
                        <p className="text-xs text-gray-600 text-center">
                            By creating an account, you agree to our{' '}
                            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">
                                Terms of Service
                            </a>
                            {' '}and{' '}
                            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">
                                Privacy Policy
                            </a>
                        </p>
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
                                    Creating account...
                                </div>
                            ) : (
                                'Sign Up'
                            )}
                        </PrimaryButton>
                    </div>
                </form>

                {/* Divider */}
                <div className="auth-divider"></div>

                {/* Login link */}
                <div className="auth-link-enter text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
