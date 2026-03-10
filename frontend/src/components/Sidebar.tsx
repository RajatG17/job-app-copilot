'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Briefcase, Settings, LogOut, Trello } from 'lucide-react';
import Cookies from 'js-cookie';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Applications', href: '/dashboard/applications', icon: Trello },
        { name: 'Resumes', href: '/dashboard/resumes', icon: FileText },
        { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    const handleLogout = () => {
        Cookies.remove('token');
        router.push('/login');
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 shrink-0 items-center px-6">
                <span className="text-xl font-bold tracking-tight text-indigo-600">AI Copilot</span>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-red-500" />
                    Logout
                </button>
            </div>
        </div>
    );
}
