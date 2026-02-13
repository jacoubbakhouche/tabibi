import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Loader2, User, Mail, Lock, FileText, ArrowLeft } from 'lucide-react';

export default function SignupDoctor() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        specialty: '',
        licenseNumber: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);

    const [isSpecialtyOpen, setIsSpecialtyOpen] = useState(false);

    const SPECIALTIES = [
        'General Practitioner',
        'Cardiologist',
        'Dermatologist',
        'Pediatrician',
        'Orthopedist',
        'Neurologist',
        'Psychiatrist',
        'Dentist',
        'Ophthalmologist',
        'Gynecologist',
        'Urologist',
        'Gastroenterologist',
        'Pulmonologist',
        'Oncologist',
        'Endocrinologist',
        'Rheumatologist',
        'Nephrologist',
        'Hematologist',
        'Anesthesiologist',
        'Radiologist',
        'Surgeon',
        'Plastic Surgeon',
        'ENT Specialist',
        'Allergist',
        'Internist',
        'Family Medicine',
        'Sports Medicine',
        'Geriatrician',
        'Pathologist',
        'Emergency Medicine',
        'Nutritionist',
        'Physiotherapist',
        'Psychologist',
        'Other'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign up the user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'doctor', // Important: Set role metadata
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create doctor profile
                const { error: doctorError } = await supabase
                    .from('doctors')
                    .insert([
                        {
                            id: authData.user.id,
                            specialty: formData.specialty,
                            license_number: formData.licenseNumber,
                            status: 'pending' // Default status
                        }
                    ]);

                if (doctorError) {
                    console.error('Doctor details error:', doctorError);
                    throw doctorError;
                }

                alert('Registration successful! Please wait for admin approval.');
                navigate('/doctor-verification');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-900" />
                    </button>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Doctor Sign Up
                </h2>
                <div className="mt-2">
                    <h3 className="text-xl font-semibold text-gray-900">Join us</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Create an account to join our medical network
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-base"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Stethoscope className="h-5 w-5 text-gray-400" />
                            </div>

                            <input
                                type="text"
                                required
                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-base"
                                placeholder="Specialty (e.g. Cardiologist)"
                                value={formData.specialty}
                                onChange={(e) => {
                                    setFormData({ ...formData, specialty: e.target.value });
                                    setIsSpecialtyOpen(true);
                                }}
                                onFocus={() => setIsSpecialtyOpen(true)}
                                onBlur={() => setTimeout(() => setIsSpecialtyOpen(false), 200)}
                            />

                            {isSpecialtyOpen && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-hide py-1">
                                    {SPECIALTIES.filter(s =>
                                        s.toLowerCase().includes(formData.specialty.toLowerCase())
                                    ).length > 0 ? (
                                        SPECIALTIES.filter(s =>
                                            s.toLowerCase().includes(formData.specialty.toLowerCase())
                                        ).map(s => (
                                            <div
                                                key={s}
                                                className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors"
                                                onClick={() => setFormData({ ...formData, specialty: s })}
                                            >
                                                {s}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                            Type to add custom specialty
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FileText className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-base"
                                placeholder="License Number"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-base"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative rounded-2xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-base"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continue'}
                        </button>
                    </div>
                </form>

                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center px-4 py-3.5 border border-gray-200 rounded-full shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="h-5 w-5 mr-3" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-gray-900 hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
