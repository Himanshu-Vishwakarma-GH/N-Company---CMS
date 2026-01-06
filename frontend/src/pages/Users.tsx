import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { Plus, User as UserIcon, Shield, Briefcase } from 'lucide-react';

const Users = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'ALL' | 'MANAGER' | 'EMPLOYEE'>('ALL');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null); // New state for editing

    // Default form state
    const [newItem, setNewItem] = useState({
        emp_id: '',
        full_name: '',
        password: '',
        role: 'EMPLOYEE',
        venture_id: user?.venture_id || '',
        is_active: true
    });

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users/');
            return res.data;
        }
    });

    const { data: ventures } = useQuery({
        queryKey: ['ventures'],
        queryFn: async () => {
            const res = await api.get('/ventures/');
            return res.data;
        },
        enabled: user?.role === 'ADMIN' // Only admins need to fetch ventures for selection
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingUser) {
                // Update
                return await api.put(`/users/${editingUser.id}`, data);
            } else {
                // Create
                const payload = { ...data, is_active: true };
                if (!payload.venture_id && user?.role === 'MANAGER') {
                    payload.venture_id = user.venture_id;
                }
                return await api.post('/users/', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateOpen(false);
            setEditingUser(null);
            // Reset form
            setNewItem({
                emp_id: '',
                full_name: '',
                password: '',
                role: 'EMPLOYEE',
                venture_id: user?.venture_id || '',
                is_active: true
            });
        },
        onError: (err: any) => {
            alert(err.response?.data?.detail || "Failed to save user");
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newItem);
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setNewItem({
            emp_id: user.emp_id,
            full_name: user.full_name,
            password: '', // Don't fill password
            role: user.role,
            venture_id: user.venture_id,
            is_active: user.is_active
        });
        setIsCreateOpen(true);
    };

    const filteredUsers = users?.filter((u: any) => {
        if (activeTab === 'ALL') return true;
        return u.role === activeTab;
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Employees & Managers</h1>
                    <p className="text-muted-foreground">Manage system users.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create User
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b">
                {['ALL', 'MANAGER', 'EMPLOYEE'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'ALL' ? 'All Users' : tab + 's'}
                    </button>
                ))}
            </div>

            {isCreateOpen && (
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h3 className="mb-4 text-lg font-medium">{editingUser ? 'Edit User' : 'New User'}</h3>
                    <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Employee ID</label>
                                <Input
                                    value={newItem.emp_id}
                                    onChange={e => setNewItem({ ...newItem, emp_id: e.target.value })}
                                    required
                                    placeholder="e.g. MGR001"
                                    disabled={!!editingUser} // ID cannot be changed
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    value={newItem.full_name}
                                    onChange={e => setNewItem({ ...newItem, full_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Password {editingUser && '(Leave blank to keep current)'}</label>
                            <Input
                                type="password"
                                value={newItem.password}
                                onChange={e => setNewItem({ ...newItem, password: e.target.value })}
                                required={!editingUser}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Role</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newItem.role}
                                    onChange={e => setNewItem({ ...newItem, role: e.target.value })}
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    {user?.role === 'ADMIN' && <option value="MANAGER">Manager</option>}
                                    {user?.role === 'ADMIN' && <option value="ADMIN">Admin</option>}
                                </select>
                            </div>

                            {user?.role === 'ADMIN' && (
                                <div>
                                    <label className="text-sm font-medium">Venture</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newItem.venture_id}
                                        onChange={e => setNewItem({ ...newItem, venture_id: e.target.value })}
                                    >
                                        <option value="">Select Venture</option>
                                        {ventures?.map((v: any) => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {editingUser && (
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={newItem.is_active !== false} // Treat undefined/null as true for active
                                        onChange={e => setNewItem({ ...newItem, is_active: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Active Account</span>
                                </label>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button type="submit">{editingUser ? 'Update User' : 'Create User'}</Button>
                            <Button type="button" variant="secondary" onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="rounded-md border bg-white">
                <div className="p-4">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Venture ID</th>
                                <th className="px-4 py-3">Status</th>
                                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <th className="px-4 py-3">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredUsers?.map((u: any) => (
                                <tr key={u.id}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{u.full_name}</p>
                                                <p className="text-gray-500">{u.emp_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                            u.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {u.venture_id || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                        <td className="px-4 py-3">
                                            <Button variant="secondary" size="sm" onClick={() => handleEdit(u)}>Edit</Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;
