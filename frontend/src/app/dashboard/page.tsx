'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Briefcase, FileText, CheckCircle, Clock, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalResumes: 0,
        applied: 0,
        interviewing: 0,
        offered: 0,
        rejected: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch all data concurrently
                const [jobsRes, resumesRes, appsRes] = await Promise.all([
                    api.get('/api/jobs'),
                    api.get('/api/resumes'),
                    api.get('/api/applications')
                ]);

                const apps = appsRes.data;
                
                setStats({
                    totalJobs: jobsRes.data.length,
                    totalResumes: resumesRes.data.length,
                    applied: apps.filter((a: any) => a.status === 'Applied').length,
                    interviewing: apps.filter((a: any) => a.status === 'Interviewing').length,
                    offered: apps.filter((a: any) => a.status === 'Offered').length,
                    rejected: apps.filter((a: any) => a.status === 'Rejected').length,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
                <p className="text-gray-500 mt-2">Here is an overview of your job search pipeline.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tracker Stats Widgets */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Applied</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.applied}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Interviewing</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.interviewing}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Offers</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.offered}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Rejected</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.rejected}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Quick Actions / Summary */}
                <div className="bg-indigo-600 rounded-xl p-8 text-white shadow-md flex justify-between items-center bg-gradient-to-br from-indigo-600 to-indigo-800">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Tracked Jobs</h2>
                        <p className="text-indigo-100 mb-6 max-w-sm">You are currently tracking {stats.totalJobs} job listings in your database.</p>
                        <Link href="/dashboard/jobs" className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                            Manage Jobs <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                    <Briefcase className="w-24 h-24 text-indigo-400 opacity-50 hidden sm:block" />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumes Built</h2>
                        <p className="text-gray-500 mb-6 max-w-sm">You have {stats.totalResumes} tailored resumes uploaded for analysis.</p>
                        <Link href="/dashboard/resumes" className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                            Manage Resumes <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                    <FileText className="w-24 h-24 text-gray-200 hidden sm:block" />
                </div>
            </div>
        </div>
    );
}
