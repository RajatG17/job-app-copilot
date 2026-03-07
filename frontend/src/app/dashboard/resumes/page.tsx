'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { UploadCloud, FileText, Trash2, Loader2, Eye } from 'lucide-react';

interface Resume {
    id: number;
    filename: string;
    created_at: string;
    parsed_text: string;
}

export default function ResumesPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            const { data } = await api.get('/api/resumes');
            setResumes(data);
        } catch (error) {
            console.error('Failed to fetch resumes:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/api/resumes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFile(null);
            await fetchResumes();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload resume. Make sure it is a valid PDF.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                    <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Upload a New Resume</h3>
                    <p className="text-sm text-gray-500 mb-6">PDF max 5MB. We'll automatically extract the text.</p>

                    <div className="flex items-center space-x-3">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                        {file && (
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Upload
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Saved Resumes</h2>

            {resumes.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-gray-500">
                    No resumes found. Upload one above to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-start mb-4">
                                <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                                    <FileText className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 truncate max-w-[200px]" title={resume.filename}>
                                        {resume.filename}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Uploaded {new Date(resume.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                <button className="flex-1 flex justify-center items-center py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                                    <Eye className="w-4 h-4 mr-1.5" /> Preview
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
