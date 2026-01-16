import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

import { Play, Square, Timer } from 'lucide-react';

// --- Sortable Task Item ---
const TaskCard = ({ task, isOverlay, onStartTimer, onStopTimer }: { task: any, isOverlay?: boolean, onStartTimer?: (id: number) => void, onStopTimer?: (id: number) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isOverlay ? 0.8 : 1,
    };

    if (isOverlay) {
        return (
            <div className="bg-white p-3 rounded shadow-lg border border-blue-500 cursor-grabbing z-50">
                <h4 className="font-semibold text-sm">{task.title}</h4>
            </div>
        )
    }

    const isTimerRunning = !!task.active_timer_start;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 rounded shadow-sm border mb-2 group relative hover:shadow-md transition-all"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm leading-tight flex-1 mr-2">{task.title}</h4>
                <div className="flex flex-col gap-1 items-end">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                        }`}>
                        {task.priority?.charAt(0)}
                    </span>

                    {/* Timer Control */}
                    {!isOverlay && onStartTimer && onStopTimer && (
                        <div
                            className="mt-1"
                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag
                        >
                            {isTimerRunning ? (
                                <button
                                    onClick={() => onStopTimer(task.id)}
                                    className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 text-[10px] font-medium border border-red-200"
                                    title="Stop Timer"
                                >
                                    <Square className="w-3 h-3 fill-current" /> Stop
                                </button>
                            ) : (
                                <button
                                    onClick={() => onStartTimer(task.id)}
                                    className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 flex items-center gap-1 text-[10px] font-medium border border-green-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Start Timer"
                                >
                                    <Play className="w-3 h-3 fill-current" /> Start
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {task.assignee && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[9px]">
                        {task.assignee.full_name.charAt(0)}
                    </div>
                    {task.assignee.full_name}
                </div>
            )}
        </div>
    );
};

// --- Column Component ---
const TaskColumn = ({ id, tasks, title, onStartTimer, onStopTimer }: { id: string, tasks: any[], title: string, onStartTimer: (id: number) => void, onStopTimer: (id: number) => void }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="bg-gray-50 p-4 rounded-lg min-h-[500px] w-72 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">{title}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{tasks.length}</span>
            </div>

            <SortableContext id={id} items={tasks} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className="flex-1">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onStartTimer={onStartTimer}
                            onStopTimer={onStopTimer}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};

// --- Main Board Component ---
interface TaskBoardProps {
    tasks: any[];
    onStatusChange: (taskId: number, newStatus: string) => void;
    onStartTimer: (taskId: number) => void;
    onStopTimer: (taskId: number) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onStatusChange, onStartTimer, onStopTimer }) => {
    const [activeId, setActiveId] = React.useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Drag distance threshold
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const columns = [
        { id: 'ASSIGNED', title: 'To Do' },
        { id: 'IN_PROGRESS', title: 'In Progress' },
        { id: 'REVIEW', title: 'Review' },
        { id: 'COMPLETED', title: 'Done' },
    ];

    const getTasksByStatus = (status: string) => {
        return tasks.filter(t => t.status === status);
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Find the task
            const task = tasks.find(t => t.id === active.id);
            if (!task) return;

            // Determine new status
            // Note: 'over.id' could be the Column ID OR a Task ID within that column
            let newStatus = over.id;

            // If dropped on a task, find that task's status
            if (!columns.some(c => c.id === newStatus)) {
                // Not a column ID, must be a task ID
                // Wait, useDroppable on Column gives the ID.
                // But Sortable items also have IDs.
                // We need to check if 'over.id' is a column or a task
                const overTask = tasks.find(t => t.id === over.id);
                if (overTask) {
                    newStatus = overTask.status;
                } else {
                    // check if it's a column
                    const isColumn = columns.some(c => c.id === over.id);
                    if (!isColumn) return; // Dropped on nothing?
                }
            }

            if (task.status !== newStatus) {
                onStatusChange(task.id, newStatus);
            }
        }
        setActiveId(null);
    };

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 overflow-x-auto pb-4">
                {columns.map(col => (
                    <TaskColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={getTasksByStatus(col.id)}
                        onStartTimer={onStartTimer}
                        onStopTimer={onStopTimer}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default TaskBoard;
