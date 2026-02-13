import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Appointment {
    id: string;
    appointment_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    doctor: {
        id: string;
        specialty: string;
        location_lat: number;
        location_lng: number;
        profiles: {
            full_name: string;
            avatar_url: string | null;
        } | {
            full_name: string;
            avatar_url: string | null;
        }[];
    } | {
        id: string;
        specialty: string;
        location_lat: number;
        location_lng: number;
        profiles: {
            full_name: string;
            avatar_url: string | null;
        } | {
            full_name: string;
            avatar_url: string | null;
        }[];
    }[];
}

export default function AppointmentsList({ userId }: { userId: string | undefined }) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) fetchAppointments();
    }, [userId]);

    const fetchAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_time,
                    status,
                    doctor:doctors (
                        id,
                        specialty,
                        location_lat,
                        location_lng,
                        profiles (full_name, avatar_url)
                    )
                `)
                .eq('patient_id', userId)
                .order('appointment_time', { ascending: true });

            if (error) throw error;
            // Cast data to Appointment[] to satisfy TS, knowing the structure matches
            setAppointments((data as any) || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="w-4 h-4 mr-1" />;
            case 'pending': return <Clock className="w-4 h-4 mr-1" />;
            case 'cancelled': return <XCircle className="w-4 h-4 mr-1" />;
            default: return <AlertCircle className="w-4 h-4 mr-1" />;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading appointments...</div>;

    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Calendar className="w-16 h-16 mb-4 opacity-20" />
                <p>No appointments found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {appointments.map((appt) => {
                const date = new Date(appt.appointment_time);

                // Helper to get helper properties safely
                const getDoctor = () => {
                    const doc = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor;
                    return doc;
                };

                const getProfile = () => {
                    const doc = getDoctor();
                    if (!doc) return null;
                    const prof = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;
                    return prof;
                };

                const doctor = getDoctor();
                const profile = getProfile();

                return (
                    <div key={appt.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-xs font-bold uppercase tracking-wider flex items-center ${getStatusColor(appt.status)}`}>
                            {getStatusIcon(appt.status)}
                            {appt.status}
                        </div>

                        <div className="flex items-start space-x-4">
                            <img
                                src={profile?.avatar_url || 'https://via.placeholder.com/50'}
                                alt="Doctor"
                                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg">{profile?.full_name}</h3>
                                <p className="text-blue-600 text-sm font-medium mb-2">{doctor?.specialty}</p>

                                <div className="flex items-center text-gray-500 text-sm mb-1">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                    {date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </div>
                                <div className="flex items-center text-gray-500 text-sm">
                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                    {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
