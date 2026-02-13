import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Save, Loader2, Upload, Calendar, Crosshair, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import DoctorBottomNav from '../components/DoctorBottomNav';
import ChatPage from './ChatPage';

interface DoctorProfile {
    id: string;
    specialty: string;
    license_number: string;
    bio: string | null;
    consultation_fee: number | null;
    status: 'pending' | 'approved' | 'rejected';
    location_lat: number | null;
    location_lng: number | null;
    availability: any; // JSONB
    image_url: string | null;
    phone: string | null;
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDashboard() {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<'chat' | 'appointments' | 'profile'>('profile');
    const [activeProfileTab, setActiveProfileTab] = useState<'about' | 'availability' | 'reviews'>('about');

    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form States
    const [bio, setBio] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [availability, setAvailability] = useState<any>({});
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchDoctorProfile();
            if (activeTab === 'appointments') fetchAppointments();
        }
    }, [user, activeTab]);

    const fetchDoctorProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select('*, profiles(full_name, avatar_url)')
                .eq('id', user?.id)
                .single();

            if (error) throw error;

            if (data) {
                setDoctor(data);
                setBio(data.bio || '');
                setConsultationFee(data.consultation_fee?.toString() || '');
                setPhone(data.phone || '');
                setImageUrl(data.image_url || data.profiles.avatar_url || '');
                if (data.location_lat && data.location_lng) {
                    setLocation({ lat: data.location_lat, lng: data.location_lng });
                }
                const initialAvailability = data.availability || {};
                DAYS.forEach(day => {
                    if (!initialAvailability[day]) {
                        initialAvailability[day] = { start: '09:00', end: '17:00', enabled: false };
                    }
                });
                setAvailability(initialAvailability);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`*, profiles:patient_id (full_name, avatar_url)`)
                .eq('doctor_id', user?.id)
                .order('appointment_time', { ascending: true });
            if (error) throw error;
            setAppointments(data || []);
        } catch (error) { console.error(error); }
    };

    const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
        try {
            const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
            if (error) throw error;
            fetchAppointments();
        } catch (error) { console.error(error); }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) return;
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}/doctor_image_${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setImageUrl(data.publicUrl);
        } catch (error: any) { alert(error.message); } finally { setUploading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('doctors').update({
                bio, consultation_fee: parseFloat(consultationFee), location_lat: location?.lat, location_lng: location?.lng,
                availability: availability, image_url: imageUrl, phone: phone
            }).eq('id', user?.id);
            if (error) throw error;
            alert('Profile updated!');
            fetchDoctorProfile();
        } catch (error: any) { alert(error.message); } finally { setSaving(false); }
    };

    const handleAvailabilityChange = (day: string, field: string, value: any) => {
        setAvailability((prev: any) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!doctor) return <div className="p-8">Doctor profile not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-32 relative"> {/* Added strict pb-32 for nav clearance */}

            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-30 px-4 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="bg-blue-600 text-white p-1 rounded-lg mr-2"><LayoutDashboard className="w-5 h-5" /></span>
                    {activeTab === 'chat' ? 'Messages' : activeTab === 'appointments' ? 'Requests' : 'My Profile'}
                </h1>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
            </div>

            {/* Sidebar Drawer */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <div className="relative w-64 h-full bg-white shadow-2xl animate-slide-in-right flex flex-col z-50">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="font-bold text-lg">Menu</h2>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-4 flex-1">
                            <div className="bg-blue-50 p-4 rounded-xl mb-6">
                                <div className="flex items-center space-x-3 mb-2">
                                    <img src={imageUrl || "https://via.placeholder.com/40"} alt="User" className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{doctor.profiles.full_name}</p>
                                        <p className="text-xs text-blue-600 font-medium">Doctor Account</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t">
                            <button onClick={signOut} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 flex items-center font-medium">
                                <LogOut className="w-5 h-5 mr-3" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto p-4">

                {/* VIEW: CHAT */}
                {activeTab === 'chat' && (
                    <div className="h-[calc(100vh-180px)]"> {/* Adjusted height */}
                        <ChatPage />
                    </div>
                )}

                {/* VIEW: APPOINTMENTS */}
                {activeTab === 'appointments' && (
                    <div className="space-y-4 pb-20">
                        {appointments.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No appointment requests yet.</div>
                        ) : (
                            appointments.map(app => (
                                <div key={app.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {app.profiles.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{app.profiles.full_name}</h3>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {new Date(app.appointment_time).toLocaleString()}
                                            </div>
                                            {app.notes && <p className="text-xs text-gray-400 mt-1 italic">"{app.notes}"</p>}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 w-full sm:w-auto">
                                        {app.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateAppointmentStatus(app.id, 'confirmed')} className="flex-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200">Confirm</button>
                                                <button onClick={() => updateAppointmentStatus(app.id, 'cancelled')} className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200">Decline</button>
                                            </>
                                        )}
                                        {app.status === 'confirmed' && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">Confirmed</span>}
                                        {app.status === 'cancelled' && <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium border border-red-200">Cancelled</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW: PROFILE (Default) */}
                {activeTab === 'profile' && (
                    <div className="pb-24">
                        {/* Status Banner */}
                        <div className={`mb-6 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm ${doctor.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' : doctor.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                            <span className="font-medium flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${doctor.status === 'approved' ? 'bg-green-500' : doctor.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                Account Status: {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                            </span>
                        </div>

                        {/* Main Profile Card */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6 relative">
                            {/* Decorative Background */}
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-10 -mb-10 blur-xl"></div>
                            </div>

                            <div className="px-6 pb-6">
                                {/* Header Section */}
                                <div className="relative flex flex-col items-center -mt-16 mb-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full p-1 bg-white shadow-lg">
                                            <img
                                                src={imageUrl || "https://via.placeholder.com/150"}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover bg-gray-100"
                                            />
                                        </div>
                                        <label className="absolute bottom-1 right-1 bg-blue-600 p-2.5 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-lg transition-transform hover:scale-105 active:scale-95 border-2 border-white">
                                            <Upload className="w-4 h-4" />
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                        </label>
                                    </div>

                                    <div className="text-center mt-4">
                                        {/* Specialty Badge */}
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-3 border border-blue-100 shadow-sm">
                                            {doctor.specialty}
                                        </span>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                            Dr. {doctor.profiles.full_name}
                                        </h2>
                                        <div className="text-gray-500 text-sm font-medium">
                                            <span className="text-green-600 text-lg font-bold">{consultationFee || '0'} DZD</span>
                                            <span className="text-gray-400"> / Consultation</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <div className="text-center border-r border-gray-200 last:border-0">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <span className="text-xl font-bold text-gray-900">11</span>
                                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Years Exp.</p>
                                    </div>
                                    <div className="text-center border-r border-gray-200 last:border-0">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <span className="text-xl font-bold text-gray-900">59</span>
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Reviews</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <span className="text-xl font-bold text-gray-900">5.0</span>
                                            <span className="text-yellow-400">★</span>
                                        </div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Rating</p>
                                    </div>
                                </div>

                                {/* Profile Tabs */}
                                <div className="flex justify-center space-x-2 mb-6 bg-gray-100 p-1.5 rounded-xl">
                                    {['About', 'Availability', 'Reviews'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveProfileTab(tab.toLowerCase() as any)}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${activeProfileTab === tab.toLowerCase()
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="min-h-[300px]">
                                    {activeProfileTab === 'about' && (
                                        <div className="space-y-5 animate-fade-in-up">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center">
                                                    About Me
                                                </h3>
                                                <textarea
                                                    rows={4}
                                                    className="w-full bg-gray-50 border-gray-200 rounded-xl text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500 p-4 transition-shadow hover:shadow-sm"
                                                    placeholder="Tell patients about your experience..."
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Consultation Fee</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-full pl-6 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
                                                            value={consultationFee}
                                                            onChange={(e) => setConsultationFee(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone</label>
                                                    <input
                                                        type="tel"
                                                        className="w-full bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 py-2.5"
                                                        placeholder="05XXXXXXXX"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Clinic Location</h3>
                                                    {location && (
                                                        <button
                                                            onClick={() => setShowLocationPicker(true)}
                                                            className="text-xs text-blue-600 font-bold hover:underline flex items-center"
                                                        >
                                                            <Crosshair className="w-3 h-3 mr-1" /> Edit Location
                                                        </button>
                                                    )}
                                                </div>
                                                {location ? (
                                                    <div className="h-40 bg-gray-100 rounded-2xl overflow-hidden relative group border border-gray-200">
                                                        <LocationPicker onLocationSelect={() => { }} initialLat={location.lat} initialLng={location.lng} disableClick={true} />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowLocationPicker(true)}
                                                        className="w-full h-32 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors group"
                                                    >
                                                        <MapPin className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                                                        <span className="font-bold text-sm">Set Clinic Location</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeProfileTab === 'availability' && (
                                        <div className="space-y-2 animate-fade-in-up">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Weekly Schedule</h3>
                                            {DAYS.map(day => (
                                                <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex items-center">
                                                            <input type="checkbox" checked={availability[day]?.enabled || false} onChange={(e) => handleAvailabilityChange(day, 'enabled', e.target.checked)} className="peer w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                                        </div>
                                                        <span className={`font-medium ${availability[day]?.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                                                    </div>

                                                    {availability[day]?.enabled ? (
                                                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                                                            <input type="time" value={availability[day]?.start} onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)} className="border-0 p-0 text-sm font-medium text-gray-700 w-16 text-center focus:ring-0" />
                                                            <span className="text-gray-300">|</span>
                                                            <input type="time" value={availability[day]?.end} onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)} className="border-0 p-0 text-sm font-medium text-gray-700 w-16 text-center focus:ring-0" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold text-gray-300 uppercase px-3">Off</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeProfileTab === 'reviews' && (
                                        <div className="text-center py-10 animate-fade-in-up">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">💬</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">No Reviews Yet</h3>
                                            <p className="text-gray-500 text-sm">Patient reviews will appear here once you start completing appointments.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Floating Save Button */}
                        <div className="fixed bottom-24 right-6 z-40">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-full shadow-lg shadow-blue-500/30 flex items-center font-bold tracking-wide transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-1"
                            >
                                {saving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Location Picker Modal - Improved Mobile Layout */}
            {showLocationPicker && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"> {/* High z-index */}
                    <div className="bg-white rounded-xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold flex items-center text-gray-800"><MapPin className="w-5 h-5 mr-2 text-red-500" /> Pin Your Clinic</h3>
                            <button onClick={() => setShowLocationPicker(false)} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
                        </div>
                        <div className="flex-1 relative bg-gray-100">
                            <LocationPicker onLocationSelect={(lat, lng) => setLocation({ lat, lng })} initialLat={location?.lat} initialLng={location?.lng} />

                            {/* Centered Map Marker Overlay (Visual Guide) */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[400]" style={{ marginTop: '-20px' }}>
                                <MapPin className="w-10 h-10 text-red-600 drop-shadow-lg fill-current animate-bounce" />
                            </div>

                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[500] w-full px-6">
                                <button onClick={() => setShowLocationPicker(false)} className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl hover:bg-blue-700 transition-colors text-lg">
                                    Confirm Location
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <DoctorBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
