'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Briefcase, Loader2, Calendar, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export enum ApplicationStatus {
    APPLIED = 'Applied',
    INTERVIEWING = 'Interviewing',
    OFFERED = 'Offered',
    REJECTED = 'Rejected',
}

interface Application {
    id: number;
    job_id: number;
    resume_id: number | null;
    status: ApplicationStatus;
    notes: string | null;
    created_at: string;
    job: {
        id: number;
        title: string;
        company: string;
    };
}

const COLUMNS = [
    { id: ApplicationStatus.APPLIED, title: 'Applied' },
    { id: ApplicationStatus.INTERVIEWING, title: 'Interviewing' },
    { id: ApplicationStatus.OFFERED, title: 'Offered' },
    { id: ApplicationStatus.REJECTED, title: 'Rejected' },
];

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [resumes, setResumes] = useState<any[]>([]);
    const [newAppForm, setNewAppForm] = useState({ job_id: '', resume_id: '' });

    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [coverLetter, setCoverLetter] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const { data } = await api.get('/api/applications');
            setApplications(data);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFormOptions = async () => {
        setIsAdding(true);
        try {
            const [jobsRes, resumesRes] = await Promise.all([
                api.get('/api/jobs'),
                api.get('/api/resumes')
            ]);
            setJobs(jobsRes.data);
            setResumes(resumesRes.data);
        } catch (error) {
            console.error('Failed to fetch options', error);
        }
    };

    const handleCreateApp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppForm.job_id) return;
        try {
            await api.post('/api/applications', {
                job_id: parseInt(newAppForm.job_id),
                resume_id: newAppForm.resume_id ? parseInt(newAppForm.resume_id) : null
            });
            setIsAdding(false);
            setNewAppForm({ job_id: '', resume_id: '' });
            fetchApplications();
        } catch (error) {
            console.error('Failed to create application', error);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedApp || !selectedApp.resume_id) return;
        setIsAnalyzing(true);
        setMatchScore(null);
        setCoverLetter(null);
        try {
            const scoreRes = await api.get(`/api/matching/score/${selectedApp.job_id}/${selectedApp.resume_id}`);
            setMatchScore(scoreRes.data.similarity_score);

            const tailorRes = await api.post(`/api/matching/tailor`, {
                job_id: selectedApp.job_id,
                resume_id: selectedApp.resume_id
            });
            setCoverLetter(tailorRes.data.cover_letter);
        } catch (error: any) {
            console.error('Analysis failed', error);
            alert(error.response?.data?.detail || 'Failed to analyze. Ensure embeddings exist.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const openDetails = (app: Application) => {
        setSelectedApp(app);
        setMatchScore(null);
        setCoverLetter(null);
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const appId = parseInt(draggableId);
        const newStatus = destination.droppableId as ApplicationStatus;

        // Optimistic UI update
        setApplications((prev) =>
            prev.map((app) =>
                app.id === appId ? { ...app, status: newStatus } : app
            )
        );

        try {
            await api.patch(`/api/applications/${appId}`, { status: newStatus });
        } catch (error) {
            console.error('Failed to update application status:', error);
            // Revert on failure
            fetchApplications();
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Application Pipeline</h1>
                    <p className="text-gray-500 mt-1">Drag and drop applications to update their status.</p>
                </div>
                <Button onClick={fetchFormOptions} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> New Application
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 h-full items-start">
                        {COLUMNS.map((col) => {
                            const colApps = applications.filter((app) => app.status === col.id);

                            return (
                                <div key={col.id} className="w-80 shrink-0 flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden">
                                    <div className="px-5 py-4 font-semibold text-gray-700 flex justify-between items-center border-b border-gray-200 bg-gray-50/50">
                                        {col.title}
                                        <span className="bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full text-sm">
                                            {colApps.length}
                                        </span>
                                    </div>

                                    <Droppable droppableId={col.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                                                    }`}
                                            >
                                                {colApps.map((app, index) => (
                                                    <Draggable key={app.id} draggableId={app.id.toString()} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                onClick={() => openDetails(app)}
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-3 hover:border-indigo-300 transition-colors cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''
                                                                    }`}
                                                            >
                                                                <h4 className="font-semibold text-gray-900 break-words mb-1">
                                                                    {app.job.title}
                                                                </h4>
                                                                <div className="flex items-center text-sm text-gray-600 mb-3">
                                                                    <Briefcase className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                                                    {app.job.company}
                                                                </div>
                                                                <div className="flex justify-between items-center align-bottom border-t border-gray-100 pt-3">
                                                                    <span className="flex items-center text-xs text-gray-500">
                                                                        <Calendar className="w-3 h-3 mr-1" />
                                                                        {new Date(app.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-semibold text-xl text-gray-900">New Application</h3>
                            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateApp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Job</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newAppForm.job_id}
                                    onChange={(e) => setNewAppForm({ ...newAppForm, job_id: e.target.value })}
                                >
                                    <option value="">-- Choose a job --</option>
                                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} @ {j.company}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Resume (Optional)</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newAppForm.resume_id}
                                    onChange={(e) => setNewAppForm({ ...newAppForm, resume_id: e.target.value })}
                                >
                                    <option value="">-- No resume attached --</option>
                                    {resumes.map(r => <option key={r.id} value={r.id}>{r.filename}</option>)}
                                </select>
                            </div>
                            <Button type="submit" className="w-full">Create Tracker</Button>
                        </form>
                    </div>
                </div>
            )}

            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
                            <div>
                                <h3 className="font-semibold text-xl text-gray-900">{selectedApp.job.title}</h3>
                                <p className="text-sm text-gray-500">{selectedApp.job.company}</p>
                            </div>
                            <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                            {!selectedApp.resume_id ? (
                                <div className="text-center py-10 bg-white border border-gray-200 rounded-xl">
                                    <p className="text-gray-500">No resume was attached to this application.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-white border text-center border-indigo-100 rounded-xl p-6 shadow-sm">
                                        <Sparkles className="w-8 h-8 mx-auto text-indigo-500 mb-3" />
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">AI Copilot Analysis</h4>
                                        <p className="text-sm text-gray-500 mb-5">
                                            Generate a tailored cover letter and calculate your resume's match compatibility against this job description.
                                        </p>
                                        <Button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="w-full max-w-xs mx-auto bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                                        </Button>
                                    </div>

                                    {matchScore !== null && (
                                        <div className="bg-white border border-green-100 rounded-xl p-5 flex items-center shadow-sm">
                                            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center border-4 border-green-100 shrink-0">
                                                <span className="text-xl font-bold text-green-600">{matchScore}%</span>
                                            </div>
                                            <div className="ml-4">
                                                <h5 className="font-semibold text-gray-900">Match Score</h5>
                                                <p className="text-sm text-gray-500">Based on semantic similarity between your resume keywords and the job description.</p>
                                            </div>
                                        </div>
                                    )}

                                    {coverLetter && (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 font-medium text-sm text-gray-700">
                                                Generated Cover Letter
                                            </div>
                                            <div className="p-5 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-serif">
                                                {coverLetter}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
