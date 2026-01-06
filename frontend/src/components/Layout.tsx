import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    CheckSquare,
    Megaphone,
    Calendar,
    Users,
    LogOut,
    Briefcase
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
        { name: 'Announcements', icon: Megaphone, href: '/announcements' },
        { name: 'Leaves & Holidays', icon: Calendar, href: '/leaves' },
    ];

    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        navItems.push({ name: 'Employees & Managers', icon: Users, href: '/users' });
    }

    if (user.role === 'ADMIN') {
        navItems.push({ name: 'Ventures', icon: Briefcase, href: '/ventures' });
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="hidden w-64 flex-col border-r bg-white md:flex">
                <div className="flex h-14 items-center border-b px-4">
                    <span className="text-lg font-bold">Agency CMS</span>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) => cn(
                                    "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                                    isActive
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="border-t p-4">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-auto text-gray-400 hover:text-gray-500"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
                    <span className="font-bold">Agency CMS</span>
                    <button onClick={handleLogout}><LogOut className="h-5 w-5" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
