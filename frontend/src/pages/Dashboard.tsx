import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.full_name}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Stats Cards Placeholder */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Pending Tasks</h3>
                    <div className="mt-2 text-3xl font-bold">5</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Announcements</h3>
                    <div className="mt-2 text-3xl font-bold">2</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Leave Balance</h3>
                    <div className="mt-2 text-3xl font-bold">12</div>
                </div>
            </div>

            {/* More widgets based on role can be added here */}
            {user?.role === 'ADMIN' && (
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Admin Overview</h3>
                    <p className="mt-2 text-sm text-gray-500">System stats will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
