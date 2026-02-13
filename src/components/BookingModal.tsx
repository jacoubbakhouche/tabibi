import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, X, Calendar, Clock, FileText } from 'lucide-react';

interface Doctor {
    id: string;
    specialty: string;
    profiles: {
        full_name: string;
    };
    consultation_fee: number | null;
}

interface BookingModalProps {
    doctor: Doctor;
    patientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BookingModal({ doctor, patientId, onClose, onSuccess }: BookingModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!date || !time) {
                throw new Error("Please select both date and time.");
            }

            // Combine date and time into TIMESTAMPTZ format (ISO 8601)
            const appointmentTime = new Date(`${date}T${time}`).toISOString();

            const { error: insertError } = await supabase
                .from('appointments')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctor.id,
                    appointment_time: appointmentTime,
                    status: 'pending',
                    notes: notes
                });

            if (insertError) throw insertError;

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Get current date for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-medium text-gray-900">
                        Book Appointment
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <p className="text-sm text-blue-800">
                        Booking with <span className="font-semibold">{doctor.profiles.full_name}</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        {doctor.specialty} • Fee: {doctor.consultation_fee ? `${doctor.consultation_fee} DZD` : 'Not specified'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" /> Date
                        </label>
                        <input
                            type="date"
                            min={today}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-gray-400" /> Time
                        </label>
                        <input
                            type="time"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                            <FileText className="w-4 h-4 mr-1 text-gray-400" /> Reason / Notes
                        </label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Briefly describe your symptoms or reason for visit..."
                        />
                    </div>

                    {error && (
                        <div className="p-2 rounded text-sm bg-red-100 text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
