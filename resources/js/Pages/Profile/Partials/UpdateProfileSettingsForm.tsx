import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TextArea from '@/Components/TextArea';
import ImageCropper from '@/Components/ImageCropper';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { User as UserType } from '@/types/chat';

interface UpdateProfileSettingsFormProps {
    className?: string;
}

type PrivacyLevel = 'everyone' | 'contacts' | 'nobody';

export default function UpdateProfileSettingsForm({
    className = '',
}: UpdateProfileSettingsFormProps) {
    const user = usePage().props.auth.user as UserType & { bio?: string; last_seen_privacy?: string; avatar?: string };
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const { data, setData, post, errors, processing, recentlySuccessful, reset } =
        useForm<{
            name: string;
            bio: string;
            avatar: File | null;
            last_seen_privacy: PrivacyLevel;
        }>({
            name: user.name || '',
            bio: user.bio || '',
            avatar: null as File | null,
            last_seen_privacy: (user.last_seen_privacy || 'everyone') as PrivacyLevel,
        });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create reader to get the image data for cropper
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        // Convert blob to File
        const croppedFile = new File([croppedBlob], 'avatar.jpg', {
            type: 'image/jpeg',
        });

        setData('avatar', croppedFile);

        // Create preview URL
        const previewReader = new FileReader();
        previewReader.onloadend = () => {
            setPreviewUrl(previewReader.result as string);
        };
        previewReader.readAsDataURL(croppedBlob);

        setShowCropper(false);
        setImageToCrop(null);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setImageToCrop(null);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('bio', data.bio);
        formData.append('last_seen_privacy', data.last_seen_privacy);
        if (data.avatar) {
            formData.append('avatar', data.avatar);
        }
        formData.append('_method', 'patch');

        // Use router.post to handle FormData
        const router = require('@inertiajs/react').router;
        router.post(route('profile.update'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreviewUrl(null);
            },
        });
    };

    const avatarUrl = previewUrl || (user.avatar ? `/storage/${user.avatar}` : null);

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Settings
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your profile details and privacy settings.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Avatar Section */}
                <div className="border-b pb-6">
                    <InputLabel value="Profile Picture" className="mb-4" />
                    
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <svg
                                    className="w-12 h-12 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            )}
                        </div>

                        <div className="flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Photo
                            </button>
                            <p className="mt-2 text-sm text-gray-500">
                                JPG, PNG, GIF or WebP. Max 5MB.
                            </p>
                            <InputError className="mt-2" message={errors.avatar as any} />
                        </div>
                    </div>
                </div>

                {/* Display Name */}
                <div>
                    <InputLabel htmlFor="name" value="Display Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        placeholder="Enter your display name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                {/* Bio/Status */}
                <div>
                    <InputLabel htmlFor="bio" value="Bio (Status)" />

                    <TextArea
                        id="bio"
                        className="mt-1 block w-full"
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        placeholder="What's on your mind? (e.g., 'Available', 'In a meeting', 'DND')"
                        rows={3}
                    />

                    <div className="mt-2 flex justify-between">
                        <InputError message={errors.bio} />
                        <span className="text-xs text-gray-500">{data.bio.length}/500</span>
                    </div>
                </div>

                {/* Last Seen Privacy */}
                <div className="border-t pt-6">
                    <InputLabel value="Last Seen Visibility" className="mb-4" />

                    <div className="space-y-3">
                        {[
                            {
                                value: 'everyone',
                                label: '👥 Everyone',
                                description: 'All WhatsApp contacts can see when you were last online',
                            },
                            {
                                value: 'contacts',
                                label: '👤 My Contacts Only',
                                description: 'Only people in your contacts can see your last seen status',
                            },
                            {
                                value: 'nobody',
                                label: '🔒 Nobody',
                                description: 'No one can see your last seen time, but you can see others',
                            },
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                                    data.last_seen_privacy === option.value
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="last_seen_privacy"
                                    value={option.value}
                                    checked={data.last_seen_privacy === option.value}
                                    onChange={(e) =>
                                        setData('last_seen_privacy', e.target.value as PrivacyLevel)
                                    }
                                    className="mt-1 rounded-full border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {option.label}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {option.description}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <InputError
                        className="mt-2"
                        message={errors.last_seen_privacy}
                    />
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600 font-medium">
                            ✓ Settings saved successfully.
                        </p>
                    </Transition>
                </div>
            </form>

            {/* Image Cropper Modal */}
            {showCropper && imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </section>
    );
}
