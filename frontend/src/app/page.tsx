import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Briefcase, FileText, Bot } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md fixed w-full z-50 top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Sparkles className="h-6 w-6 text-indigo-600 mr-2" />
                            <span className="font-bold text-xl text-gray-900 tracking-tight">AI Job Copilot</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                                Log in
                            </Link>
                            <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Now powered by advanced LLM vector matching
                </div>
                
                <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    Land your dream job <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">faster with AI.</span>
                </h1>
                
                <p className="mx-auto max-w-2xl text-lg tracking-tight text-gray-500 sm:text-xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    Supercharge your job search. Track applications, auto-tailor your resumes to specific job descriptions, and generate custom interview prep sheets in seconds.
                </p>
                
                <div className="flex justify-center gap-x-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                    <Link href="/signup" className="group rounded-full bg-gray-900 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-all flex items-center">
                        Start tracking for free
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Feature Grid */}
                <div className="mt-32 grid grid-cols-1 gap-y-12 sm:grid-cols-3 sm:gap-x-8 text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 mb-6">
                            <Briefcase className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Kanban Pipeline</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Drag and drop your way to success. Visually track every application from "Applied" to "Offer" in a beautifully organized board.
                        </p>
                    </div>
                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 mb-6">
                            <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Cover Letters</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Stop staring at a blank page. We use your base resume and the job description to write a highly-targeted cover letter instantly.
                        </p>
                    </div>
                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 mb-6">
                            <Bot className="h-6 w-6 text-pink-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">AI Interview Prep</h3>
                        <p className="text-gray-500 leading-relaxed">
                            Nail your interviews. Get a custom list of behavioral and technical questions based on the exact job requirements and your background.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
