import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Stethoscope, Loader2 } from 'lucide-react';

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
                // Note: The 'profiles' trigger should handle the base profile creation.
                // We just need to insert into the 'doctors' table.
                // However, there might be a race condition if the trigger hasn't fired yet.
                // A safer way is to wait or ensure the trigger logic is robust.
                // For now, let's assume the trigger works or we manually insert if needed.

                // Insert additional doctor details
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
                    // Check if it's a "foreign key violation" meaning profile doesn't exist yet (trigger delay)
                    // In a real app, we might retry or use a better flow. 
                    // For this demo, let's just alert.
                    console.error('Doctor details error:', doctorError);
                    throw doctorError;
                }

                alert('Registration successful! Please wait for admin approval.');
                navigate('/doctor-verification');
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-50">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="mb-6">
                    <div onClick={() => navigate('/signup')} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to selection
                    </div>
                </div>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg mb-4">
                        <Stethoscope className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Doctor Registration
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join our exclusive medical network
                    </p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-white/50 ring-1 ring-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                className="appearance-none block w-full px-4 py-3 bg-white/50 border border-gray-200/60 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="Dr. John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">Medical Specialty</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-4 py-3 bg-white/50 border border-gray-200/60 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    placeholder="Search or type specialty..."
                                    value={formData.specialty}
                                    onChange={(e) => {
                                        setFormData({ ...formData, specialty: e.target.value });
                                        setIsSpecialtyOpen(true);
                                    }}
                                    onFocus={() => setIsSpecialtyOpen(true)}
                                    // Delay hiding to allow click event to register
                                    onBlur={() => setTimeout(() => setIsSpecialtyOpen(false), 200)}
                                />
                                <div className="absolute right-3 top-3.5 text-gray-400 pointer-events-none">
                                    <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
                                </div>

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
                                                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 transition-colors"
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
                            <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">License Number</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. 12345/DZ"
                                className="appearance-none block w-full px-4 py-3 bg-white/50 border border-gray-200/60 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">Email address</label>
                            <input
                                type="email"
                                required
                                className="appearance-none block w-full px-4 py-3 bg-white/50 border border-gray-200/60 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="doctor@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="appearance-none block w-full px-4 py-3 bg-white/50 border border-gray-200/60 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Register as Doctor'}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white/50 backdrop-blur text-gray-500 rounded-full">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white/80 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
