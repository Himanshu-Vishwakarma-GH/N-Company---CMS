import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Clock, CheckCircle2, Activity } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['analytics'],
        queryFn: async () => {
            const res = await api.get('/analytics/dashboard');
            return res.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Loading analytics...</p>
            </div>
        );
    }

    // Prepare data for charts
    const statusData = Object.entries(analytics?.tasks_by_status || {}).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
    }));

    const COLORS = {
        'ASSIGNED': '#3b82f6',
        'IN PROGRESS': '#f59e0b',
        'REVIEW': '#8b5cf6',
        'COMPLETED': '#10b981',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.full_name}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
                        <Activity className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="mt-2 text-3xl font-bold">{analytics?.total_tasks || 0}</div>
                    <p className="mt-1 text-xs text-gray-500">
                        {analytics?.completion_rate || 0}% completed
                    </p>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-green-600">
                        {analytics?.tasks_completed || 0}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Tasks finished
                    </p>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Hours Logged</h3>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-blue-600">
                        {analytics?.total_hours_logged || 0}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Total time tracked
                    </p>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Active Timers</h3>
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-orange-600">
                        {analytics?.active_timers || 0}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Currently running
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Tasks by Status - Pie Chart */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4">Tasks by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Activity - Line Chart */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4">Weekly Activity (Hours)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics?.weekly_activity || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                formatter={(value: any) => [`${value} hrs`, 'Hours']}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="hours"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Bar Chart */}
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <h3 className="font-semibold leading-none tracking-tight mb-4">Task Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" name="Tasks" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;
