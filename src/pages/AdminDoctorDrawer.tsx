import { useState } from 'react';
import { X, FileText, Check, Ban, ExternalLink, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DoctorDrawerProps {
    doctor: any;
    isOpen: boolean;
    onClose: () => void;
    onVerify: (id: string, status: 'approved' | 'rejected') => void;
}

export default function AdminDoctorDrawer({ doctor, isOpen, onClose, onVerify }: DoctorDrawerProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen || !doctor) return null;

    const openDocument = async (path: string) => {
        try {
            const { data, error } = await supabase.storage.from('doctor-documents').createSignedUrl(path, 3600);
            if (error) throw error;
            window.open(data.signedUrl, '_blank');
        } catch (error) {
            console.error('Error opening document:', error);
            alert('Could not open document. Check permissions or if file exists.');
        }
    };

    const handleAction = async (status: 'approved' | 'rejected') => {
        setLoading(true);
        await onVerify(doctor.id, status);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 bg-white shadow-xl flex flex-col h-full">

                    {/* Header */}
                    <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Review Doctor Application</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                        {/* Profile Section */}
                        <div className="flex items-start space-x-4">
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 text-xl font-bold">
                                {doctor.profiles?.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{doctor.profiles?.full_name}</h3>
                                <p className="text-sm text-blue-600 font-medium">{doctor.specialty || 'Unspecified Specialty'}</p>
                                <div className="flex items-center text-sm text-gray-500 mt-1 space-x-2">
                                    {/* Email removed as it is not in profiles table */}
                                </div>
                            </div>
                        </div>

                        <hr />

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="col-span-2">
                                <p className="text-gray-500 text-xs uppercase tracking-wide">License Number</p>
                                <p className="font-medium text-gray-900">{doctor.license_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide">Experience</p>
                                <p className="font-medium text-gray-900">{doctor.experience_years || 0} Years</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide">Status</p>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${doctor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    doctor.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {doctor.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <hr />

                        {/* Documents Section */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                                Verification Documents
                            </h4>

                            {doctor.verification_docs && doctor.verification_docs.length > 0 ? (
                                <div className="space-y-3">
                                    {doctor.verification_docs.map((doc: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                            <div className="flex items-center overflow-hidden">
                                                <div className="p-2 bg-white rounded-md border mr-3">
                                                    <FileText className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                                                    <p className="text-xs text-gray-400">{new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openDocument(doc.path)}
                                                className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                                title="View Document"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500">No documents uploaded.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t space-y-3">
                        {doctor.status === 'pending' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleAction('rejected')}
                                    disabled={loading}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : <><X className="w-4 h-4 mr-2" /> Reject</>}
                                </button>
                                <button
                                    onClick={() => handleAction('approved')}
                                    disabled={loading}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : <><Check className="w-4 h-4 mr-2" /> Approve</>}
                                </button>
                            </div>
                        ) : doctor.status === 'approved' ? (
                            <button
                                onClick={() => handleAction('rejected')}
                                disabled={loading}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:ring-red-500 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : <><Ban className="w-4 h-4 mr-2" /> Deactivate Account</>}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction('approved')}
                                disabled={loading}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : <><Check className="w-4 h-4 mr-2" /> Reactivate Account</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
