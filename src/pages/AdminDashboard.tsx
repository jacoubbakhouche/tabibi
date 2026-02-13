import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Check, X, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Doctor {
    id: string;
    full_name: string;
    specialty: string | null;
    license_number: string | null;
    status: 'pending' | 'approved' | 'rejected';
    is_verified: boolean;
    verification_docs?: { name: string; path: string; type: string }[];
    profiles: { full_name: string; email: string };
}

export default function AdminDashboard() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    const { signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const fetchDoctors = async () => {
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select(`
          *,
          profiles (full_name)
        `)
                .eq('status', 'pending');

            if (error) throw error;
            setDoctors(data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    const openDocument = async (path: string) => {
        try {
            const { data, error } = await supabase.storage.from('doctor-documents').createSignedUrl(path, 3600);
            if (error) throw error;
            window.open(data.signedUrl, '_blank');
        } catch (error) {
            console.error('Error opening document:', error);
            alert('Could not open document. Check permissions.');
        }
    };

    const handleVerify = async (doctorId: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('doctors')
                .update({ status, is_verified: status === 'approved' })
                .eq('id', doctorId);

            if (error) throw error;
            fetchDoctors(); // Refresh list
        } catch (error) {
            console.error('Error updating doctor status:', error);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                >
                    Log Out
                </button>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {doctors.length === 0 ? (
                        <li className="px-4 py-4 sm:px-6 text-gray-500">No pending doctor verifications.</li>
                    ) : (
                        doctors.map((doctor) => (
                            <li key={doctor.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {doctor.profiles?.full_name || 'Unknown'}
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                        Specialty: {doctor.specialty || 'N/A'}
                                    </p>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                        License: {doctor.license_number || 'N/A'}
                                    </p>
                                    {doctor.verification_docs && doctor.verification_docs.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">Submitted Documents:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {doctor.verification_docs.map((doc, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => openDocument(doc.path)}
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <FileText className="h-4 w-4 mr-1 text-blue-500" />
                                                        {doc.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleVerify(doctor.id, 'approved')}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <Check className="h-4 w-4 mr-1" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleVerify(doctor.id, 'rejected')}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <X className="h-4 w-4 mr-1" /> Reject
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
