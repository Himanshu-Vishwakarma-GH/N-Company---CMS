import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const Announcements = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', content: '' });

    const { data: announcements = [], refetch } = useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const res = await api.get('/announcements/');
            return res.data;
        },
        refetchInterval: 5000,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.post('/announcements/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setIsCreateOpen(false);
            setNewItem({ title: '', content: '' });
        },
        onError: (err: any) => {
            alert("Failed to create announcement");
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newItem);
    };

    const acknowledge = async (id: number) => {
        try {
            await api.post(`/announcements/${id}/acknowledge`);
            refetch();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to acknowledge");
        }
    }

    const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                    <p className="text-muted-foreground">Important updates and news.</p>
                </div>
                {isManager && (
                    <Button onClick={() => setIsCreateOpen(true)}>Create Announcement</Button>
                )}
            </div>

            {isCreateOpen && (
                <div className="rounded-lg border bg-white p-6 shadow-lg mb-6">
                    <h3 className="mb-4 text-xl font-semibold">New Announcement</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                required
                                placeholder="e.g. Office Closed Tomorrow"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Content</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newItem.content}
                                onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                                required
                                placeholder="Details..."
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit">Post Announcement</Button>
                            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {announcements.map((ann: any) => (
                    <div key={ann.id} className="rounded-lg border bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold">{ann.title}</h3>
                        <p className="mt-2 text-gray-600">{ann.content}</p>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                                {new Date(ann.created_at).toLocaleDateString()}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => acknowledge(ann.id)}>
                                Acknowledge
                            </Button>
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && <p className="text-gray-500">No announcements.</p>}
            </div>
        </div>
    );
};

export default Announcements;
