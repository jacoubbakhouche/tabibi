import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, X, Loader2, Shield } from 'lucide-react';

export default function DoctorVerification() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<{ name: string, url: string, type: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setError(null);
            const file = event.target.files?.[0];
            if (!file || !user) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError, data } = await supabase.storage
                .from('doctor-documents')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL (or just keep the path if private, but for Admin view we might need signed URLs later. 
            // For now, let's store the path or public URL if bucket is public. 
            // Assumption: Bucket is PRIVATE as requested. We store the path. Admin panel will generate signed URLs.)
            // Actually, storing the full path is safest.
            const docEntry = {
                name: file.name,
                path: data.path, // Store path for signed URL generation
                type: file.type,
                uploaded_at: new Date().toISOString()
            };

            // For UI display, we might want a simple preview if image, but for now just list it.

            setDocuments(prev => [...prev, docEntry as any]);

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Error uploading document');
        } finally {
            setUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    const removeDocument = async (index: number) => {
        // Optional: Delete from storage too? For now just remove from list to be submitted.
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (documents.length === 0) {
            setError('Please upload at least one document (e.g., Medical License).');
            return;
        }

        try {
            setUploading(true);

            // Update doctors table
            const { error: updateError } = await supabase
                .from('doctors')
                .update({
                    verification_docs: documents,
                    // Optionally set status to 'pending' again if it was something else? It's already pending.
                })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            // Success
            navigate('/doctor-dashboard');

        } catch (err: any) {
            console.error('Update error:', err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
            {/* Background Elements matching Signup */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg mb-4">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Verify your Account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Upload your medical documents for admin approval.
                    </p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-white/50 ring-1 ring-gray-100">

                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                            <X className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Upload Area */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents (License, ID, etc.)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors bg-white/50">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                        >
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, PDF up to 10MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Document List */}
                        {documents.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-900">Attached Documents</h4>
                                {documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center overflow-hidden">
                                            <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                                        </div>
                                        <button onClick={() => removeDocument(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={uploading || documents.length === 0}
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-[0.98]"
                        >
                            {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit for Verification'}
                        </button>

                        <div className="text-center mt-2">
                            <button onClick={() => navigate('/doctor-dashboard')} className="text-xs text-gray-400 hover:text-gray-600">
                                Skip for now (Account will remain pending)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
