import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { Plus, Building } from 'lucide-react';

const Ventures = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingVenture, setEditingVenture] = useState<any>(null);
    const [newItem, setNewItem] = useState({ name: '', description: '' });

    const { data: ventures, isLoading } = useQuery({
        queryKey: ['ventures'],
        queryFn: async () => {
            const res = await api.get('/ventures/');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingVenture) {
                return await api.put(`/ventures/${editingVenture.id}`, data);
            } else {
                return await api.post('/ventures/', data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ventures'] });
            setIsCreateOpen(false);
            setEditingVenture(null);
            setNewItem({ name: '', description: '' });
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newItem);
    };

    const handleEdit = (venture: any) => {
        setEditingVenture(venture);
        setNewItem({ name: venture.name, description: venture.description || '' });
        setIsCreateOpen(true);
    };

    if (user?.role !== 'ADMIN') return <div>Unauthorized</div>;
    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ventures</h1>
                    <p className="text-muted-foreground">Manage your agency ventures.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Venture
                </Button>
            </div>

            {isCreateOpen && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium">{editingVenture ? 'Edit Venture' : 'New Venture'}</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">{editingVenture ? 'Update' : 'Save'}</Button>
                            <Button type="button" variant="secondary" onClick={() => { setIsCreateOpen(false); setEditingVenture(null); setNewItem({ name: '', description: '' }); }}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ventures?.map((venture: any) => (
                    <div key={venture.id} className="rounded-lg border bg-white p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <Building className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{venture.name}</h3>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">{venture.description}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end">
                            <Button variant="secondary" size="sm" onClick={() => handleEdit(venture)}>Edit</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Ventures;
