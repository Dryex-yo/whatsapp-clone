import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        post(route('password.confirm'), {
            onFinish: () => {
                reset('password');
                setIsSubmitting(false);
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="space-y-6">
                {/* Heading */}
                <div className="auth-form-group text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                        <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Confirm Password
                    </h1>
                    <p className="mt-3 text-sm text-gray-600">
                        This is a secure area. Please confirm your password to continue.
                    </p>
                </div>

                {/* Description */}
                <div className="auth-form-group bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                        For your security, we need to verify your password before you can access this area.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="space-y-5">
                    {/* Password field */}
                    <div className="auth-form-group">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="input-focus-effect mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                            isFocused={true}
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
                                    Verifying...
                                </div>
                            ) : (
                                'Confirm Password'
                            )}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
