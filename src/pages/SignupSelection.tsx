import React from 'react';
import { Link } from 'react-router-dom';
import { User, Stethoscope, ChevronRight, ShieldCheck } from 'lucide-react';

export default function SignupSelection() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 animate-fade-in">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-blue-900 mb-3 tracking-tight">Join DocLink DZ</h1>
                    <p className="text-gray-600 text-lg">Choose your account type to get started</p>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/signup/patient"
                        className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-blue-100 transition-all duration-300 flex items-center transform hover:-translate-y-1 block"
                    >
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                            <User className="w-7 h-7" />
                        </div>
                        <div className="ml-5 flex-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">I am a Patient</h3>
                            <p className="text-sm text-gray-500 mt-1">Find doctors and book appointments</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        to="/signup/doctor"
                        className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-green-100 transition-all duration-300 flex items-center transform hover:-translate-y-1 block"
                    >
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform duration-300">
                            <Stethoscope className="w-7 h-7" />
                        </div>
                        <div className="ml-5 flex-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">I am a Doctor</h3>
                            <p className="text-sm text-gray-500 mt-1">Manage patients and appointments</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>

                <div className="text-center pt-4">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Admin Bypass Link (Test Mode) */}
                <div className="text-center mt-8 pt-8 border-t border-gray-100">
                    <Link to="/admin" className="inline-flex items-center text-xs text-gray-400 hover:text-red-500 transition-colors font-medium opacity-70 hover:opacity-100">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Admin Access (Test Only)
                    </Link>
                </div>
            </div>
        </div>
    );
}
