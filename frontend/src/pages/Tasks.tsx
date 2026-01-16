import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import TaskBoard from '@/components/TaskBoard';
import { Plus, Clock, AlertCircle, CheckCircle2, User as UserIcon, LayoutDashboard, List, Play, Square } from 'lucide-react';

const Tasks = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

    // Create Task Form State
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due_date: '',
        assigned_to_ids: [] as number[], // Array for multi-select
    });

    // 1. Fetch Tasks (REAL-TIME: refetch every 5s)
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const res = await api.get('/tasks/');
            return res.data;
        },
        refetchInterval: 5000, // Poll every 5s for updates
    });

    // 2. Fetch Users (for assignment selector)
    const { data: users } = useQuery({
        queryKey: ['users_for_assignment'],
        queryFn: async () => {
            // Managers/Admins can see all relevant users
            const res = await api.get('/users/');
            return res.data;
        },
        enabled: (user?.role === 'ADMIN' || user?.role === 'MANAGER'),
    });

    // 3. Create Mutation
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.post('/tasks/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsCreateOpen(false);
            setNewItem({
                title: '',
                description: '',
                priority: 'MEDIUM',
                due_date: '',
                assigned_to_ids: [],
            });
        },
        onError: (err: any) => {
            console.error("Task Creation Error:", err);
            const detail = err.response?.data?.detail;
            alert(`Failed to create task: ${JSON.stringify(detail) || err.message}`);
        }
    });

    // 4. Update Mutation (Progress/Status)
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return await api.put(`/tasks/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    // 5. Timer Mutations
    const startTimerMutation = useMutation({
        mutationFn: async (taskId: number) => {
            return await api.post(`/tasks/${taskId}/timer/start`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (err: any) => {
            alert(err.response?.data?.detail || "Failed to start timer");
        }
    });

    const stopTimerMutation = useMutation({
        mutationFn: async (taskId: number) => {
            return await api.post(`/tasks/${taskId}/timer/stop`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (err: any) => {
            alert(err.response?.data?.detail || "Failed to stop timer");
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        let formattedDate = null;
        if (newItem.due_date) {
            formattedDate = `${newItem.due_date}T00:00:00`;
        }
        const payload = { ...newItem, due_date: formattedDate };
        createMutation.mutate(payload);
    };

    const toggleUserSelection = (userId: number) => {
        setNewItem(prev => {
            const exists = prev.assigned_to_ids.includes(userId);
            if (exists) {
                return { ...prev, assigned_to_ids: prev.assigned_to_ids.filter(id => id !== userId) };
            } else {
                return { ...prev, assigned_to_ids: [...prev.assigned_to_ids, userId] };
            }
        });
    };

    const handleStatusChange = (task: any, newStatus: string) => {
        let newProgress = task.progress;
        if (newStatus === 'COMPLETED') newProgress = 100;
        if (newStatus === 'ASSIGNED' && task.progress === 100) newProgress = 0;

        updateMutation.mutate({
            id: task.id,
            data: { status: newStatus, progress: newProgress }
        });
    };

    const handleBoardStatusChange = (taskId: number, newStatus: string) => {
        const task = tasks.find((t: any) => t.id === taskId);
        if (task) {
            handleStatusChange(task, newStatus);
        }
    };

    const handleProgressChange = (task: any, newProgress: number) => {
        updateMutation.mutate({
            id: task.id,
            data: { progress: newProgress }
        });
    };

    if (isLoading) return <div>Loading tasks...</div>;

    const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground">
                        {isManager ? 'Assign and track team tasks.' : 'Your active assignments.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1 border">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Board View"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                        </button>
                    </div>
                    {isManager && (
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Task
                        </Button>
                    )}
                </div>
            </div>

            {/* Create Modal Area */}
            {isCreateOpen && (
                <div className="rounded-lg border bg-white p-6 shadow-lg mb-6">
                    <h3 className="mb-4 text-xl font-semibold">New Task Assignment</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm font-medium">Task Title</label>
                                <Input
                                    value={newItem.title}
                                    onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                    required
                                    placeholder="e.g. Design Homepage"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Priority</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newItem.priority}
                                    onChange={e => setNewItem({ ...newItem, priority: e.target.value })}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Due Date</label>
                                <Input
                                    type="date"
                                    value={newItem.due_date}
                                    onChange={e => setNewItem({ ...newItem, due_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Assign To (Select Employees)</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                {users?.filter((u: any) => u.role === 'EMPLOYEE').map((u: any) => {
                                    const isSelected = newItem.assigned_to_ids.includes(u.id);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleUserSelection(u.id)}
                                            className={`cursor-pointer flex items-center p-2 rounded-md border text-sm transition-colors ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            {u.full_name}
                                        </div>
                                    );
                                })}
                            </div>
                            {newItem.assigned_to_ids.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Please select at least one employee.</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={newItem.assigned_to_ids.length === 0}>Assign Task(s)</Button>
                            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* View Switching */}
            {viewMode === 'board' ? (
                <TaskBoard
                    tasks={tasks || []}
                    onStatusChange={handleBoardStatusChange}
                    onStartTimer={(id) => startTimerMutation.mutate(id)}
                    onStopTimer={(id) => stopTimerMutation.mutate(id)}
                />
            ) : (
                /* List View */
                <div className="grid gap-4">
                    {tasks?.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-lg border border-dashed">No tasks found.</div>
                    ) : (
                        tasks?.map((task: any) => (
                            <div key={task.id} className="rounded-lg border bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6">
                                {/* Task Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                                                    task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                        task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                                            </div>
                                            <p className="text-gray-600 text-sm">{task.description || "No description provided."}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                task.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-4">
                                            {isManager && task.assignee && (
                                                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                    <UserIcon className="w-3.5 h-3.5" />
                                                    <span>{task.assignee.full_name}</span>
                                                </div>
                                            )}
                                            {task.due_date && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress & Controls */}
                                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 flex flex-col justify-center gap-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-medium text-gray-700">Progress</span>
                                            <span className="text-gray-500">{task.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-500"
                                                style={{ width: `${task.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Controls for Employee (Assignee) & Manager */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {(!isManager || isManager) && ( // Everyone can update status/progress for simplicity/collaboration
                                            <>
                                                <div className="flex gap-2 mb-2">
                                                    {task.active_timer_start ? (
                                                        <button
                                                            onClick={() => stopTimerMutation.mutate(task.id)}
                                                            className="flex-1 py-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center gap-2 text-xs font-semibold border border-red-200"
                                                        >
                                                            <Square className="w-3 h-3 fill-current animate-pulse" /> Stop Timer
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => startTimerMutation.mutate(task.id)}
                                                            className="flex-1 py-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center gap-2 text-xs font-semibold border border-green-200"
                                                        >
                                                            <Play className="w-3 h-3 fill-current" /> Start Timer
                                                        </button>
                                                    )}
                                                </div>

                                                <select
                                                    className="text-xs border rounded p-1.5 w-full"
                                                    value={task.status}
                                                    onChange={(e) => handleStatusChange(task, e.target.value)}
                                                >
                                                    <option value="ASSIGNED">To Do</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="REVIEW">Review</option>
                                                    <option value="COMPLETED">Done</option>
                                                </select>

                                                <input
                                                    type="range"
                                                    min="0" max="100" step="10"
                                                    className="w-full mt-2"
                                                    value={task.progress}
                                                    onChange={(e) => handleProgressChange(task, parseInt(e.target.value))}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Tasks;
