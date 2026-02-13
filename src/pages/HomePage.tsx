import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Search, Filter, Bell, Calendar, Clock } from 'lucide-react';
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

interface UserProfile {
    full_name: string;
    avatar_url: string | null;
}

interface HomePageProps {
    onNavigateToMap: () => void;
    onOpenMenu: () => void;
}

export default function HomePage({ onNavigateToMap, onOpenMenu }: HomePageProps) {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

    // Restored missing states
    const [topDoctors, setTopDoctors] = useState<Doctor[]>([]);
    const [upcomingAppt, setUpcomingAppt] = useState<any>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [doctorToBook, setDoctorToBook] = useState<Doctor | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Re-fetch or filter when search/category changes
    useEffect(() => {
        if (searchQuery || selectedCategory) {
            searchDoctors();
        } else {
            setFilteredDoctors([]); // Show default top doctors
        }
    }, [searchQuery, selectedCategory]);

    const searchDoctors = async () => {
        try {
            let query = supabase
                .from('doctors')
                .select('*, profiles(full_name, avatar_url)')
                .eq('status', 'approved');

            if (selectedCategory) {
                query = query.eq('specialty', selectedCategory);
            }

            if (searchQuery) {
                // Search by name (via profiles join) or specialty
                // Note: Supabase complex filtering on joined tables can be tricky.
                // For now, let's filter by specialty or fetching all and filtering client side if needed,
                // but better to use .ilike logic.
                // Since profiles is a potentially joined table, filtering by its column in top-level 'or' is hard without flatting.
                // Let's stick to client-side filtering for name if the dataset is small, OR use a view.
                // For this demo, let's just match specialty or fetch a larger set.
                // Actually, let's just fetch approved doctors and filter in JS for now to ensure name matching works easily.
                const { data, error } = await query;
                if (error) throw error;

                const lowerQ = searchQuery.toLowerCase();
                const filtered = (data || []).filter(doc =>
                    doc.profiles.full_name.toLowerCase().includes(lowerQ) ||
                    doc.specialty.toLowerCase().includes(lowerQ)
                );
                setFilteredDoctors(filtered);
                return;
            }

            const { data, error } = await query;
            if (error) throw error;
            setFilteredDoctors(data || []);

        } catch (error) {
            console.error("Error searching:", error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            // Profile
            const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user?.id).single();
            if (profile) setUserProfile(profile);

            // Top Doctors (Sorted by Rating High -> Low)
            const { data: doctors } = await supabase
                .from('doctors')
                .select('*, profiles(full_name, avatar_url)')
                .eq('status', 'approved')
                .order('rating', { ascending: false }) // Sort by rating
                .limit(5);
            if (doctors) setTopDoctors(doctors);

            // Upcoming Appointment (Fetch latest pending)
            const { data: appt } = await supabase
                .from('appointments')
                .select(`
                *,
                doctors (
                    specialty,
                    experience_years,
                    image_url,
                    profiles (full_name, avatar_url)
                )
            `)
                .eq('patient_id', user?.id)
                .eq('status', 'pending')
                .order('appointment_time', { ascending: true })
                .limit(1)
                .single();

            if (appt) setUpcomingAppt(appt);

        } catch (error) {
            console.error("Error home:", error);
        } finally {
            setLoading(false);
        }
    };

    const onBookingSuccess = () => {
        setBookingSuccess(true);
        fetchData(); // Refresh appt
        setTimeout(() => setBookingSuccess(false), 3000);
    };

    const categories = [
        { name: "Neurologist", icon: "🧠", color: "bg-blue-600" },
        { name: "Pediatrician", icon: "👶", color: "bg-white" },
        { name: "Dentist", icon: "🦷", color: "bg-white" },
        { name: "Cardiologist", icon: "❤️", color: "bg-white" },
    ];

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

    // Decide what list to show
    const displayDoctors = (searchQuery || selectedCategory) ? filteredDoctors : topDoctors;
    const isSearching = !!(searchQuery || selectedCategory);

    return (
        <div className="h-full overflow-y-auto pb-24 pt-4 px-4 bg-gray-50 no-scrollbar">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <button onClick={onOpenMenu} className="focus:outline-none">
                        <img
                            src={userProfile?.avatar_url || "https://via.placeholder.com/50"}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    </button>
                    <div className="ml-3">
                        <p className="text-gray-500 text-sm">Hello</p>
                        <h2 className="text-xl font-bold text-gray-900">{userProfile?.full_name?.split(' ')[0]} 👋</h2>
                    </div>
                </div>
                <button className="p-2 bg-white rounded-full shadow-sm relative">
                    <Bell className="w-6 h-6 text-gray-700" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-8">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find the right doctor for you"
                    className="flex-1 bg-transparent focus:outline-none text-sm text-gray-700"
                />
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                    }}
                    className="bg-blue-50 p-2 rounded-lg ml-2"
                >
                    {isSearching ? <span className="text-xs text-blue-600 font-bold">Clear</span> : <Filter className="w-4 h-4 text-blue-600" />}
                </button>
            </div>

            {/* Doctor Specialty */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">Doctor Specialty</h3>
                    <button className="text-gray-400 text-sm" onClick={() => setSelectedCategory('')}>See All</button>
                </div>
                <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((cat, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                            className={`flex items-center px-4 py-3 rounded-2xl whitespace-nowrap shadow-sm min-w-max transition-transform active:scale-95 ${selectedCategory === cat.name ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-600'
                                }`}
                        >
                            <span className="text-lg mr-2">{cat.icon}</span>
                            <span className="font-medium text-sm">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* My Recent Visit / Top Doctors / Search Results */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{isSearching ? 'Search Results' : 'Top Doctors'}</h3>
                    {!isSearching && <button className="text-gray-400 text-sm">See All</button>}
                </div>

                {displayDoctors.length === 0 && isSearching ? (
                    <div className="text-center py-10 text-gray-400">No doctors found.</div>
                ) : (
                    <div className={`${isSearching ? 'grid grid-cols-2 gap-4' : 'flex space-x-4 overflow-x-auto pb-4 scrollbar-hide pl-1'}`}>
                        {displayDoctors.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoctor(doc)}
                                className={`${isSearching ? 'w-full' : 'min-w-[160px]'} relative bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden group cursor-pointer hover:shadow-md transition-shadow`}
                            >
                                <div className="h-24 bg-gray-100 relative">
                                    <img
                                        src={doc.image_url || doc.profiles.avatar_url || "https://via.placeholder.com/150"}
                                        className="w-full h-full object-cover"
                                        alt="Doctor"
                                    />
                                    <div className="absolute top-2 left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                                        ⭐ {doc.rating?.toFixed(1) || '5.0'}
                                    </div>
                                </div>
                                <div className="p-3 text-center -mt-6 relative z-10">
                                    <div className="w-12 h-1 invisible"></div> {/* Spacer */}
                                </div>
                                <div className="px-3 pb-3 text-center">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{doc.profiles.full_name}</h4>
                                    <p className="text-xs text-gray-500 mb-3">{doc.specialty}</p>

                                    <div className="flex justify-center space-x-2">
                                        {/* Fake Call Action - triggers booking for demo */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDoctorToBook(doc);
                                            }}
                                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                            <Calendar className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDoctor(doc);
                                            }}
                                            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200"
                                        >
                                            <Search className="w-4 h-4" /> {/* View Details */}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Appointment */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">Upcoming Appointment</h3>
                    <button className="text-gray-400 text-sm">See All</button>
                </div>

                {upcomingAppt ? (
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="flex items-center mb-4">
                            <div className="relative">
                                <img
                                    src={upcomingAppt.doctors.image_url || upcomingAppt.doctors.profiles.avatar_url || "https://via.placeholder.com/60"}
                                    alt="Doctor"
                                    className="w-14 h-14 rounded-2xl object-cover"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full border-2 border-white">
                                    <span className="block w-2 h-2 bg-white rounded-full"></span>
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h4 className="font-bold text-gray-900">{upcomingAppt.doctors.profiles.full_name}</h4>
                                <p className="text-xs text-blue-600 font-medium">{upcomingAppt.doctors.specialty}</p>
                                <div className="flex items-center text-xs text-gray-400 mt-1">
                                    <span>⭐ 4.5</span>
                                    <span className="mx-1">•</span>
                                    <span>{upcomingAppt.doctors.experience_years} Years Exp.</span>
                                </div>
                            </div>
                            <button className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                                <span className="sr-only">Like</span>
                                ❤️
                            </button>
                        </div>

                        <div className="bg-blue-50 rounded-2xl p-4 flex justify-between items-center">
                            <div className="flex items-center space-x-3 text-xs font-semibold text-gray-600">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-blue-600" />
                                    {new Date(upcomingAppt.appointment_time).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1 text-blue-600" />
                                    {new Date(upcomingAppt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm">
                                Details
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-6 text-center text-gray-400 border border-gray-100">
                        <p>No upcoming appointments.</p>
                        <button onClick={onNavigateToMap} className="text-blue-600 text-sm font-bold mt-2">Book Now</button>
                    </div>
                )}
            </div>

            {/* Overlays */}
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
            {doctorToBook && user && (
                <BookingModal
                    doctor={doctorToBook}
                    patientId={user.id}
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
