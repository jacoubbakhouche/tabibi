import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation } from 'lucide-react';
import L from 'leaflet';
import ProfileEditor from '../components/ProfileEditor';
import BookingModal from '../components/BookingModal';
import DoctorDetails from '../components/DoctorDetails';
import BottomNav from '../components/BottomNav';
import HomePage from './HomePage';
import ChatPage from './ChatPage';
import UserMenu from '../components/UserMenu';
import AppointmentsList from '../components/AppointmentsList';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// User Icon
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Doctor Icon (Emoji - Cute)
const doctorIcon = L.divIcon({
    className: 'bg-transparent',
    html: '<div class="text-4xl filter drop-shadow-md transform hover:scale-110 transition-transform cursor-pointer">👨‍⚕️</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

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
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
}

interface UserProfile {
    full_name: string;
    age: number | null;
    avatar_url: string | null;
}

// Helper to fit bounds
const MapUpdater = ({ userLocation, nearestDoctor }: { userLocation: [number, number] | null, nearestDoctor: Doctor | null }) => {
    const map = useMap();

    useEffect(() => {
        if (userLocation && nearestDoctor && nearestDoctor.location_lat && nearestDoctor.location_lng) {
            const bounds = L.latLngBounds([userLocation, [nearestDoctor.location_lat, nearestDoctor.location_lng]]);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (userLocation) {
            map.flyTo(userLocation, 13);
        }
    }, [userLocation, nearestDoctor, map]);

    return null;
};

// Haversine formula to calculate distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

export default function PatientDashboard() {
    const { user, signOut } = useAuth();

    // Navigation State
    const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'map' | 'appointments'>('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Map States
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
    const [nearestDoctor, setNearestDoctor] = useState<Doctor | null>(null);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

    // UI States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [doctorToBook, setDoctorToBook] = useState<Doctor | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        fetchDoctors();
        if (user) fetchUserProfile();
        locateUser();
    }, [user]);

    // Re-calculate nearest doctor when specialty changes or doctors load
    useEffect(() => {
        if (selectedSpecialty && userLocation && doctors.length > 0) {
            findNearestDoctor();
        } else {
            setNearestDoctor(null);
            setRouteCoords([]);
        }
    }, [selectedSpecialty, userLocation, doctors]);

    // Fetch OSRM Route when nearest doctor changes
    useEffect(() => {
        if (userLocation && nearestDoctor && nearestDoctor.location_lat && nearestDoctor.location_lng) {
            console.log("Fetching route to:", nearestDoctor.profiles.full_name);
            fetchRoute(
                { lat: userLocation[0], lng: userLocation[1] },
                { lat: nearestDoctor.location_lat, lng: nearestDoctor.location_lng }
            );
        }
    }, [userLocation, nearestDoctor]);

    const fetchRoute = async (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => {
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
            );
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
                setRouteCoords(coords);
            }
        } catch (error) {
            console.error("Error fetching route:", error);
            // Fallback to straight line
            setRouteCoords([[start.lat, start.lng], [end.lat, end.lng]]);
        }
    };



    const locateUser = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error("Error getting location", error);
                    // Default to Algiers if blocked
                    setUserLocation([36.752887, 3.042048]);
                }
            );
        } else {
            // Default to Algiers
            setUserLocation([36.752887, 3.042048]);
        }
    };

    const fetchUserProfile = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setUserProfile(data);
    };

    const fetchDoctors = async () => {
        try {
            let query = supabase
                .from('doctors')
                .select(`
          *,
          profiles (full_name, avatar_url)
        `)
                .eq('status', 'approved')
                .not('location_lat', 'is', null)
                .not('location_lng', 'is', null);

            const { data, error } = await query;
            if (error) throw error;
            setDoctors(data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const findNearestDoctor = () => {
        if (!userLocation) return;

        const filtered = doctors.filter(d => !selectedSpecialty || d.specialty === selectedSpecialty);
        if (filtered.length === 0) {
            setNearestDoctor(null);
            return;
        }

        let minDist = Infinity;
        let nearest: Doctor | null = null;

        filtered.forEach(doc => {
            if (doc.location_lat && doc.location_lng) {
                const dist = getDistance(userLocation[0], userLocation[1], doc.location_lat, doc.location_lng);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = doc;
                }
            }
        });

        setNearestDoctor(nearest);
    };

    const onBookingSuccess = () => {
        setBookingSuccess(true);
        setTimeout(() => setBookingSuccess(false), 3000);
        setActiveTab('home'); // Go back to home to see new appointment
    };

    const handleTabChange = (tab: 'home' | 'messages' | 'map' | 'appointments') => {
        setActiveTab(tab);
    };

    const specialties = [
        "Cardiologist", "Dermatologist", "Pediatrician",
        "Neurologist", "Orthopedic Surgeon", "Psychiatrist", "Dentist"
    ];

    // Render Map View
    const renderMap = () => {
        // If we have a nearest doctor (navigation active), show only that doctor.
        // Otherwise, show all doctors filtered by specialty.
        const displayedDoctors = nearestDoctor
            ? [nearestDoctor]
            : (selectedSpecialty
                ? doctors.filter(d => d.specialty === selectedSpecialty)
                : doctors);

        return (
            <div className="h-full relative">
                {/* Map Header */}
                <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl flex-1 max-w-sm pointer-events-auto p-2 flex items-center border border-gray-100">
                        <div className="p-2 text-gray-400"><Search className="w-5 h-5" /></div>
                        <select
                            className="bg-transparent w-full text-sm text-gray-700 focus:outline-none cursor-pointer appearance-none"
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                        >
                            <option value="">Filter by Specialty...</option>
                            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* User Avatar Menu Trigger */}
                    <button
                        className="ml-3 pointer-events-auto bg-white/90 backdrop-blur-md p-1 rounded-full shadow-lg border-2 border-white"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <img
                            src={userProfile?.avatar_url || "https://via.placeholder.com/40"}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    </button>
                </div>

                {/* Floating GPS Button */}
                {!selectedDoctor && (
                    <button
                        onClick={locateUser}
                        className="absolute bottom-24 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg border border-gray-100 text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <Navigation className="w-6 h-6" />
                    </button>
                )}

                <MapContainer
                    center={userLocation || [36.752887, 3.042048]}
                    zoom={13}
                    zoomControl={false}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapUpdater userLocation={userLocation} nearestDoctor={nearestDoctor} />

                    {/* User Marker */}
                    {userLocation && (
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}

                    {/* Doctor Markers */}
                    {displayedDoctors.map(doctor => (
                        doctor.location_lat && doctor.location_lng && (
                            <Marker
                                key={doctor.id}
                                position={[doctor.location_lat, doctor.location_lng]}
                                icon={doctorIcon}
                                eventHandlers={{ click: () => setSelectedDoctor(doctor) }}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <h3 className="font-bold">{doctor.profiles.full_name}</h3>
                                        <p className="text-sm text-gray-500">{doctor.specialty}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}

                    {/* Route Line (OSRM) */}
                    {routeCoords.length > 0 && (
                        <Polyline
                            positions={routeCoords}
                            pathOptions={{ color: '#10b981', weight: 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }}
                        />
                    )}

                </MapContainer>

                {/* Nearest Doctor Info Card (Bottom Overlay) */}
                {nearestDoctor && !selectedDoctor && (
                    <div className="absolute bottom-24 left-4 right-16 z-[999] bg-white p-4 rounded-xl shadow-xl border border-blue-100 animate-slide-up">
                        <div className="flex justify-between items-center" onClick={() => setSelectedDoctor(nearestDoctor)}>
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Nearest Recommendation</p>
                                <h3 className="font-bold text-gray-900">{nearestDoctor.profiles.full_name}</h3>
                                <p className="text-xs text-gray-500">
                                    ~{getDistance(userLocation![0], userLocation![1], nearestDoctor.location_lat!, nearestDoctor.location_lng!).toFixed(1)} km away
                                </p>
                            </div>
                            <button className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                <Navigation className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 relative overflow-hidden">

            {/* Only show header for Chat/Home if needed, but Map has its own. */}

            {/* User Menu Dropdown */}
            <UserMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onEditProfile={() => setIsEditingProfile(true)}
                onSignOut={signOut}
            />

            <div className="flex-1 overflow-hidden relative z-0">
                {activeTab === 'home' && (
                    <HomePage
                        onNavigateToMap={() => setActiveTab('map')}
                        onOpenMenu={() => setIsMenuOpen(true)}
                    />
                )}

                {activeTab === 'map' && renderMap()}

                {activeTab === 'messages' && (
                    <ChatPage onChatStateChange={setIsChatOpen} />
                )}

                {activeTab === 'appointments' && (
                    <div className="h-full overflow-y-auto pb-24 pt-4 px-4 font-sans animate-fade-in custom-scrollbar">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6 px-2">My Appointments</h1>
                        <AppointmentsList userId={user?.id} />
                    </div>
                )}
            </div>



            {/* Bottom Navigation (Hidden when Doctor Details is open OR Chat is active) */}
            {!selectedDoctor && !isChatOpen && (
                <BottomNav activeTab={activeTab as any} onTabChange={(tab) => handleTabChange(tab as any)} />
            )}

            {/* Overlays */}
            {/* Overlays */}
            {selectedDoctor && (
                <DoctorDetails
                    doctor={selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                    onBook={() => {
                        setDoctorToBook(selectedDoctor);
                        setSelectedDoctor(null);
                    }}
                    onLocate={() => {
                        console.log("onLocate triggered for:", selectedDoctor?.profiles?.full_name);
                        const doctorToLocate = selectedDoctor;
                        setSelectedDoctor(null); // Close modal first

                        setTimeout(() => {
                            setNearestDoctor(doctorToLocate);
                            setActiveTab('map');
                        }, 100);
                    }}
                />
            )}

            {isEditingProfile && user && userProfile && (
                <ProfileEditor
                    initialName={userProfile.full_name}
                    initialAge={userProfile.age}
                    initialAvatar={userProfile.avatar_url}
                    userId={user.id}
                    onClose={() => setIsEditingProfile(false)}
                    onUpdate={fetchUserProfile}
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
