import React, { useEffect, useState } from 'react';
import api from '@/api/axios';
import { Button } from '@/components/ui/Button';

const Leaves = () => {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [leavesRes, holidaysRes] = await Promise.all([
                api.get('/leaves/'),
                api.get('/leaves/holidays')
            ]);
            setLeaves(leavesRes.data);
            setHolidays(holidaysRes.data);
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Leaves</h1>
                        <p className="text-muted-foreground">Your leave history and upcoming holidays.</p>
                    </div>
                    <Button>Request Leave</Button>
                </div>

                <div className="rounded-md border bg-white p-4">
                    <h2 className="mb-4 text-lg font-semibold">My Leaves</h2>
                    <div className="divide-y">
                        {leaves.map((leave) => (
                            <div key={leave.id} className="flex items-center justify-between py-2">
                                <div>
                                    <span className="font-medium">{leave.leave_type}</span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {leave.start_date} - {leave.end_date}
                                    </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {leave.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold">Upcoming Holidays</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {holidays.map((holiday) => (
                        <div key={holiday.id} className="rounded-lg border bg-gray-50 p-4">
                            <div className="font-semibold">{holiday.name}</div>
                            <div className="text-sm text-gray-500">{holiday.date}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaves;
