import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Star, Calendar, MessageSquare, Phone, ChevronLeft, Share2, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    availability?: any;
    image_url?: string | null;
    phone?: string | null;
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
}

interface DoctorDetailsProps {
    doctor: Doctor;
    onClose: () => void;
    onBook?: () => void;
    onLocate?: () => void;
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DoctorDetails({ doctor, onClose, onBook, onLocate }: DoctorDetailsProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'about' | 'availability' | 'reviews'>('availability');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);

    // Reviews State
    const [reviews, setReviews] = useState<any[]>([]);

    const [reviewStats, setReviewStats] = useState({ rating: doctor.rating || 5.0, count: doctor.reviews_count || 0 });


    useEffect(() => {
        if (doctor.id) {
            fetchReviews();
        }
    }, [doctor.id, user]);

    const fetchReviews = async () => {
        const { data } = await supabase
            .from('reviews')
            .select('*')
            .eq('doctor_id', doctor.id)
            .order('created_at', { ascending: false });

        if (data) {
            setReviews(data);
            // Calculate local stats
            const count = data.length;
            const avg = count > 0 ? data.reduce((a: any, b: any) => a + b.rating, 0) / count : (doctor.rating || 5.0);
            setReviewStats({ rating: avg, count });

            if (user) {
                // const userReview = data.find((r: any) => r.patient_id === user.id);
                // setHasReviewed(!!userReview);
            }
        }
    };



    // Generate next 14 days
    const upcomingDates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    // Generate Dynamic Time Slots based on Doctor's Availability
    const availableSlots = useMemo(() => {
        if (!doctor.availability) return [];

        const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }); // 'Monday'
        const schedule = doctor.availability[dayName];

        if (!schedule || !schedule.enabled) return [];

        const slots = [];
        const [startH, startM] = schedule.start.split(':').map(Number);
        const [endH, endM] = schedule.end.split(':').map(Number);

        let current = new Date(selectedDate);
        current.setHours(startH, startM, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(endH, endM, 0, 0);

        // 30-minute intervals
        while (current < end) {
            slots.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
            current.setMinutes(current.getMinutes() + 30);
        }
        return slots;
    }, [selectedDate, doctor.availability]);


    const handleBook = async () => {
        // If external handler provided, use it (preferred for booking modal)
        if (onBook) {
            onBook();
            return;
        }

        // internal fallback (existing logic)
        if (!selectedTime) {
            alert('Please select a time slot.');
            return;
        }
        if (!user) {
            alert('Please login to book.');
            return;
        }

        setBooking(true);
        try {
            const [hours, minutes] = selectedTime.split(':');
            const appointmentTime = new Date(selectedDate);
            appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0);

            const { error } = await supabase
                .from('appointments')
                .insert([{
                    patient_id: user.id,
                    doctor_id: doctor.id,
                    appointment_time: appointmentTime.toISOString(),
                    status: 'pending',
                    notes: 'Booking via Mobile App'
                }]);

            if (error) throw error;
            alert('Appointment request sent!');
            onClose();
        } catch (error: any) {
            alert('Error booking: ' + error.message);
        } finally {
            setBooking(false);
        }
    };

    const handleChat = async () => {
        navigate('/chat', { state: { targetUser: doctor } });
    };

    const handleLocate = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (onLocate) onLocate();
        onClose(); // Close details to show map
    };

    const handleCall = () => {
        if (doctor.phone) {
            window.location.href = `tel:${doctor.phone}`;
        } else {
            alert('Phone number not available.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up overflow-hidden">

            {/* Customized Header */}
            <div className="px-4 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
                <button type="button" onClick={onClose} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                </button>
                <span className="text-lg font-bold text-gray-900">Doctor Details</span>
                <button type="button" className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                    <Share2 className="w-5 h-5 text-gray-900" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 bg-white">

                {/* Main Card Container */}
                <div className="mx-4 mt-2 rounded-[40px] shadow-sm pb-8 mb-4 relative overflow-hidden h-[450px]">

                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#eff6ff] to-[#f0fdf4] -z-20"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100/50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 -z-10 pointer-events-none"></div>

                    {/* Top Section: Text Left, Image Right */}
                    <div className="px-6 pt-8 flex h-full relative">

                        {/* Left Column: Text Info */}
                        <div className="w-1/2 flex flex-col justify-start z-10 pt-4">
                            <span className="inline-block px-4 py-1.5 rounded-2xl bg-blue-100 text-blue-600 font-bold text-xs mb-4 w-fit">
                                {doctor.specialty}
                            </span>
                            <h2 className="text-3xl font-extrabold text-gray-900 leading-[1.2] mb-3">
                                Dr. {doctor.profiles.full_name.split(' ')[0]} <br />
                                {doctor.profiles.full_name.split(' ').slice(1).join(' ')}
                            </h2>
                            <div className="text-gray-600 font-medium text-lg flex items-center mb-4">
                                <span className="text-green-600 font-bold mr-1">{doctor.consultation_fee ? `$${doctor.consultation_fee}` : 'Free'}</span>
                                <span className="text-gray-400 text-sm">/ Session</span>
                            </div>
                        </div>

                        {/* Right Column: Large Image (Right aligned, bleeding out) */}
                        <div className="absolute right-0 bottom-0 w-[60%] h-[85%] z-0">
                            <img
                                src={doctor.image_url || doctor.profiles.avatar_url || "https://via.placeholder.com/300x400"}
                                alt={doctor.profiles.full_name}
                                className="w-full h-full object-cover object-top mask-image-gradient"
                                style={{
                                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                                }}
                            />
                        </div>

                        {/* Glassmorphism Stats Card - Floating at Bottom Center */}
                        <div className="absolute bottom-6 left-4 right-4 h-24 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg grid grid-cols-3 items-center z-20 divide-x divide-gray-200/30">
                            <div className="text-center px-1">
                                <div className="flex justify-center items-center gap-1 mb-0.5">
                                    <span className="text-xl font-bold text-gray-900">{doctor.experience_years}</span>
                                    <span className="text-[10px] text-gray-500 font-bold -mb-1">/Yr</span>
                                    <CheckCircle className="w-4 h-4 text-green-500 ml-0.5" />
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium">Experience</p>
                            </div>

                            <div className="text-center px-1">
                                <div className="flex justify-center items-center gap-1 mb-0.5">
                                    <span className="text-xl font-bold text-gray-900">{reviewStats.count}</span>
                                    <MessageSquare className="w-4 h-4 text-blue-400 fill-blue-400" />
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium">Reviews</p>
                            </div>

                            <div className="text-center px-1">
                                <div className="flex justify-center items-center gap-1 mb-0.5">
                                    <span className="text-xl font-bold text-gray-900">{reviewStats.rating.toFixed(1)}</span>
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium">Rating</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 mb-6">
                    <div className="flex justify-center space-x-2 mb-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-100">
                        {['About', 'Availability', 'Reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.toLowerCase()
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="px-6 pb-20">
                    {/* Action Buttons Row - Only show in About tab or always? Let's keep them handy above content or in content */}
                    {activeTab === 'about' && (
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <button onClick={handleChat} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 group-active:scale-95 transition-transform">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500">Chat</span>
                            </button>

                            <button onClick={handleCall} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100 group-active:scale-95 transition-transform">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500">Call</span>
                            </button>

                            <button onClick={handleLocate} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shadow-sm border border-purple-100 group-active:scale-95 transition-transform">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500">GPS</span>
                            </button>

                            <button onClick={handleBook} disabled={booking} className="flex flex-col items-center gap-2 group">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-transform ${booking ? 'bg-gray-100' : 'bg-blue-600 text-white shadow-blue-200'}`}>
                                    <Calendar className={`w-6 h-6 ${booking ? 'text-gray-400' : 'text-white'}`} />
                                </div>
                                <span className="text-xs font-semibold text-gray-500">Book</span>
                            </button>
                        </div>
                    )}


                    {/* Availability (Booking) - Matches mockup "Select Date" */}
                    {activeTab === 'availability' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-gray-900">Select Date</h3>
                                <div className="flex items-center text-gray-400 text-sm font-medium">
                                    <ChevronLeft className="w-5 h-5 mr-1" />
                                    {selectedDate.toLocaleString('default', { month: 'long' })}
                                    <ChevronLeft className="w-5 h-5 ml-1 rotate-180" />
                                </div>
                            </div>

                            {/* Horizontal Date Picker */}
                            <div className="flex justify-between items-center mb-8 overflow-x-auto no-scrollbar pb-2">
                                {upcomingDates.slice(0, 5).map((date, idx) => { // Show fewer for clean look like mockup
                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-col items-center justify-center w-14 h-[4.5rem] rounded-[20px] flex transition-all ${isSelected
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-300 transform scale-105'
                                                : 'bg-white text-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className={`text-[10px] uppercase font-bold mb-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{SHORT_DAYS[date.getDay()]}</span>
                                            <span className="text-xl font-bold">{date.getDate()}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Time Slots */}
                            <h3 className="font-bold text-xl text-gray-900 mb-4">Available Time</h3>
                            <div className="space-y-6">
                                {availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {availableSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-3 rounded-2xl text-sm font-bold border transition-all ${selectedTime === time
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                    : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 font-medium">Not available on this day.</p>
                                    </div>
                                )}
                            </div>
                            {/* Book Button in Availability Tab as well */}
                            <button
                                onClick={handleBook}
                                disabled={booking || !selectedTime}
                                className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:shadow-none"
                            >
                                Book Appointment
                            </button>
                        </div>
                    )}

                    {/* Tab Content: About */}
                    {activeTab === 'about' && (
                        <div className="animate-fade-in space-y-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 mb-3">Biography</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">
                                    {doctor.bio || `Dr. ${doctor.profiles.full_name} is a dedicated specialist in ${doctor.specialty} with over ${doctor.experience_years} years of experience in providing top-quality medical care to patients of all ages.`}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-gray-900 mb-3">Location</h3>
                                <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
                                    <div onClick={handleLocate} className="flex items-center p-3 cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors group">
                                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mr-4 group-hover:scale-105 transition-transform">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-gray-900">Main Clinic</p>
                                            <p className="text-xs text-gray-500">123 Health Street, Algiers</p>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180 ml-auto" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Reviews */}
                    {activeTab === 'reviews' && (
                        <div className="animate-fade-in">
                            <div className="text-center py-12">
                                <div className="inline-block p-4 rounded-full bg-blue-50 mb-4">
                                    <MessageSquare className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Patient Reviews</h3>
                                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">See what other patients are saying about Dr. {doctor.profiles.full_name.split(' ')[0]}</p>

                                <div className="space-y-4 text-left">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-3 shadow-sm">
                                                        U
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-bold text-gray-900">Patient</h5>
                                                        <div className="flex text-yellow-400 text-[10px]">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-semibold">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-gray-600 text-sm pl-0 leading-relaxed mt-2">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
