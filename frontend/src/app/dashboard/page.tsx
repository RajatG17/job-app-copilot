import React from 'react';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[80vh] bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to AI Job Copilot 🎯</h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                    You have successfully authenticated! On Day 2, we will start building out the Resume and Job Managers on this dashboard.
                </p>
            </div>
        </div>
    );
}
