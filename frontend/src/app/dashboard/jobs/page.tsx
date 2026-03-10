'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Briefcase, Building2, Link as LinkIcon, Plus, Loader2, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Job {
    id: number;
    title: string;
    company: string;
    description: string;
    url: string | null;
    created_at: string;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', company: '', url: '', description: '' });
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const { data } = await api.get('/api/jobs');
            setJobs(data);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/api/jobs', formData);

            // Generate embeddings
            if (data?.id) {
                await api.post(`/api/embeddings/jobs/${data.id}`);
            }

            setIsAdding(false);
            setFormData({ title: '', company: '', url: '', description: '' });
            await fetchJobs();
        } catch (error) {
            console.error('Failed to create job:', error);
            alert('Failed to add job.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteJob = async (id: number) => {
        if (!confirm('Are you sure you want to delete this job?\n\nWarning: Any tracked applications for this job will also be permanently deleted.')) return;
        try {
            await api.delete(`/api/jobs/${id}`);
            setJobs(jobs.filter(j => j.id !== id));
        } catch (error) {
            console.error('Failed to delete job', error);
            alert('Failed to delete job.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tracked Jobs</h1>
                <Button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Job
                </Button>
            </div>

            {isAdding && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <Input required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="e.g. Google" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Link URL (Optional)</label>
                                <Input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Paste the job description here..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="submit" isLoading={isSubmitting}>Save Job</Button>
                        </div>
                    </form>
                </div>
            )}

            {jobs.length === 0 && !isAdding ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 flex flex-col items-center">
                    <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No jobs tracked yet</h3>
                    <p className="text-gray-500 mt-1 mb-6">Start building your application pipeline by adding a job.</p>
                    <Button onClick={() => setIsAdding(true)} variant="outline">Add your first job</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1" title={job.title}>{job.title}</h3>
                                </div>
                                <div className="flex items-center text-gray-600 text-sm mb-1">
                                    <Building2 className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {job.company}
                                </div>
                                {job.url && (
                                    <div className="flex items-center text-sm">
                                        <LinkIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                                        <a href={job.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline truncate">
                                            View Posting
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 bg-white">
                                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                                    {job.description}
                                </p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>Added {new Date(job.created_at).toLocaleDateString()}</span>
                                    <div className="flex space-x-2">
                                        <Button onClick={() => handleDeleteJob(job.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <Button onClick={() => setSelectedJob(job)} variant="outline" size="sm" className="h-8">Details</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <h3 className="font-semibold text-xl text-gray-900 pr-8">
                                {selectedJob.title}
                            </h3>
                            <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-1.5 text-gray-400" />
                                {selectedJob.company}
                            </div>
                            {selectedJob.url && (
                                <div className="flex items-center">
                                    <LinkIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                                    <a href={selectedJob.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                        View Posting
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="p-5 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed flex-1">
                            {selectedJob.description}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
