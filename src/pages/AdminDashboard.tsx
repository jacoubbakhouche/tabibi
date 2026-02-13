import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, User, Search, Filter, Stethoscope, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminDoctorDrawer from './AdminDoctorDrawer';

interface Doctor {
    id: string;
    full_name: string;
    specialty: string | null;
    license_number: string | null;
    experience_years: number;
    phone: string | null;
    status: 'pending' | 'approved' | 'rejected';
    is_verified: boolean;
    verification_docs?: { name: string; path: string; type: string }[];
    profiles: { full_name: string; email: string };
    image_url?: string;
}

export default function AdminDashboard() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
    }, [activeTab]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select(`
                  *,
                  profiles (full_name)
                `)
                .eq('status', activeTab)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDoctors(data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (doctorId: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('doctors')
                .update({
                    status,
                    is_verified: status === 'approved'
                })
                .eq('id', doctorId);

            if (error) throw error;

            // Refresh list and close drawer
            fetchDoctors();
            setIsDrawerOpen(false);
        } catch (error) {
            console.error('Error updating doctor status:', error);
            alert('Failed to update status');
        }
    };

    const handleCardClick = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setIsDrawerOpen(true);
    };

    const filteredDoctors = doctors.filter(doc =>
        doc.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-400">
                                    Admin Portal
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                {/* Header & Tabs */}
                <div className="mb-8">
                    <div className="sm:flex sm:items-center sm:justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>

                        {/* Search */}
                        <div className="mt-4 sm:mt-0 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2"
                                placeholder="Search doctors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`${activeTab === 'pending'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                Pending Requests
                                <span className={`${activeTab === 'pending' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'} ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium inline-block`}>
                                    {activeTab === 'pending' ? doctors.length : ''}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`${activeTab === 'approved'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                Active Doctors
                            </button>
                        </nav>
                    </div>
                </div>

                {/* List Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredDoctors.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                <User className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    No {activeTab} doctors match your search.
                                </p>
                            </div>
                        ) : (
                            filteredDoctors.map((doctor) => (
                                <div
                                    key={doctor.id}
                                    onClick={() => handleCardClick(doctor)}
                                    className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                                >
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                {doctor.image_url ? (
                                                    <img className="h-12 w-12 rounded-full object-cover" src={doctor.image_url} alt="" />
                                                ) : (
                                                    <span className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                        {doctor.profiles?.full_name?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                                    {doctor.profiles?.full_name}
                                                </h3>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Stethoscope className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    <span className="truncate">{doctor.specialty || 'Unspecified'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-5 py-3">
                                        <div className="text-sm">
                                            <span className="font-medium text-blue-600 group-hover:text-blue-500">
                                                View Application &rarr;
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Verification Drawer */}
            <AdminDoctorDrawer
                doctor={selectedDoctor}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onVerify={handleVerify}
            />
        </div>
    );
}
