import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Star } from 'lucide-react';
import DoctorDetails from '../components/DoctorDetails';
import BookingModal from '../components/BookingModal';

interface Doctor {
    id: string;
    specialty: string;
    bio: string | null;
    consultation_fee: number | null;
    location_lat: number | null;
    location_lng: number | null;
    rating: number;
    reviews_count: number;
    experience_years: number;
    patients_count: number;
    image_url: string | null;
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
}

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [specialties, setSpecialties] = useState<{ name: string, icon: any }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [doctorToBook, setDoctorToBook] = useState<Doctor | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        fetchUserId();
    }, []);

    useEffect(() => {
        filterDoctors();
    }, [searchQuery, selectedCategory, doctors]);

    const fetchUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Doctors
            const { data: docs } = await supabase
                .from('doctors')
                .select('*, profiles(full_name, avatar_url)')
                .eq('status', 'approved');

            if (docs) {
                setDoctors(docs);
                // Extract Specialties
                const unique = [...new Set(docs.map(d => d.specialty))].sort();
                const mapped = unique.map(name => ({
                    name,
                    icon: "🩺"
                }));
                setSpecialties(mapped);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterDoctors = () => {
        let temp = doctors;

        if (selectedCategory) {
            temp = temp.filter(d => d.specialty === selectedCategory);
        }

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            temp = temp.filter(d =>
                d.profiles.full_name.toLowerCase().includes(lowerQ) ||
                d.specialty.toLowerCase().includes(lowerQ)
            );
        }

        setFilteredDoctors(temp);
    };

    const onBookingSuccess = () => {
        setBookingSuccess(true);
        setTimeout(() => setBookingSuccess(false), 3000);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="px-4 pt-6 pb-2 bg-white sticky top-0 z-10 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Find a Doctor</h1>

                {/* Search */}
                <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search doctor, specialty..."
                        className="flex-1 bg-transparent focus:outline-none text-sm text-gray-900"
                    />
                </div>

                {/* Specialties Filter */}
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        All
                    </button>
                    {specialties.map((cat, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">No doctors found.</div>
                ) : (
                    filteredDoctors.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => setSelectedDoctor(doc)}
                            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col group active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                                            <Star className="w-3 h-3 mr-1 fill-current" /> {doc.rating?.toFixed(1) || '5.0'}
                                        </div>
                                        {doc.consultation_fee && (
                                            <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {doc.consultation_fee} DA
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{doc.profiles.full_name}</h3>
                                    <p className="text-gray-500 text-sm mb-2">{doc.specialty}</p>

                                    <div className="text-xs text-gray-400 font-medium">
                                        {doc.patients_count > 0 ? `${doc.patients_count} Patients` : 'New Doctor'}
                                    </div>
                                </div>
                                <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden ml-4 relative shrink-0">
                                    <img
                                        src={doc.image_url || doc.profiles.avatar_url || "https://via.placeholder.com/150"}
                                        className="w-full h-full object-cover"
                                        alt="Doctor"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDoctorToBook(doc);
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    Book Now
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDoctor(doc);
                                    }}
                                    className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-2xl font-semibold text-sm hover:bg-blue-100 transition-colors border border-blue-100"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))
                )}
                {/* Bottom spacer for nav */}
                <div className="h-20"></div>
            </div>

            {/* Modals */}
            {selectedDoctor && (
                <DoctorDetails
                    doctor={selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                    onBook={() => {
                        setDoctorToBook(selectedDoctor);
                        setSelectedDoctor(null);
                    }}
                />
            )}
            {doctorToBook && userId && (
                <BookingModal
                    doctor={doctorToBook}
                    patientId={userId}
                    onClose={() => setDoctorToBook(null)}
                    onSuccess={onBookingSuccess}
                />
            )}
            {bookingSuccess && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl z-[2000] animate-bounce font-medium">
                    ✅ Appointment Booked!
                </div>
            )}
        </div>
    );
}
