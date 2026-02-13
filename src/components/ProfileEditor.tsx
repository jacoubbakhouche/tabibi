import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, X, User, Upload } from 'lucide-react';

interface ProfileEditorProps {
    initialName: string;
    initialAge: number | null;
    initialAvatar: string | null;
    userId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function ProfileEditor({ initialName, initialAge, initialAvatar, userId, onClose, onUpdate }: ProfileEditorProps) {
    const [fullName, setFullName] = useState(initialName);
    const [age, setAge] = useState<string>(initialAge?.toString() || '');
    const [avatarUrl, setAvatarUrl] = useState(initialAvatar || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setMessage(null);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);
            setMessage({ type: 'success', text: 'Image uploaded successfully!' });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    age: age ? parseInt(age) : null,
                    avatar_url: avatarUrl
                })
                .eq('id', userId);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile updated!' });
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 1000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-2" /> Edit Profile
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-4 space-y-4">

                    <div className="text-center mb-4">
                        <div className="relative inline-block group">
                            <img
                                src={avatarUrl || "https://via.placeholder.com/150?text=User"}
                                alt="Avatar"
                                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                            />
                            <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                                <Upload className="h-4 w-4 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">{uploading ? 'Uploading...' : 'Click icons to upload new photo'}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <input
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="e.g. 25"
                        />
                    </div>

                    {message && (
                        <div className={`p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
