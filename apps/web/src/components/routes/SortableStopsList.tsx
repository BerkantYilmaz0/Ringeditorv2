'use client';

import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Stop } from '@/lib/stops';

interface SortableStopItemProps {
    stop: Stop;
    index: number;
    onRemove: (id: number) => void;
}

function SortableStopItem({ stop, index, onRemove }: SortableStopItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stop.id.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 bg-white border ${isDragging ? 'border-primary shadow-lg scale-[1.02]' : 'border-slate-200'
                } px-3 py-2 rounded-lg text-sm font-medium text-slate-700 transition-colors mb-2 group`}
        >
            {/* Sürükleme Tutamacı */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50"
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <span className="w-5 text-center text-xs font-bold text-slate-400">
                {index + 1}.
            </span>

            <span className="flex-1 truncate">
                {stop.name}
            </span>

            <button
                type="button"
                onPointerDown={(e) => {
                    // Prevent the drag from firing when removing
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(stop.id);
                }}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

interface SortableStopsListProps {
    stops: Stop[];
    onChange: (newStops: Stop[]) => void;
    onRemove: (id: number) => void;
}

export function SortableStopsList({ stops, onChange, onRemove }: SortableStopsListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px sürüklendikten sonra başla (tıklama ile karışmasın)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // Eğer geçersiz bir yere bırakılırsa veya kendi üzerine bırakılırsa
        // dnd-kit varsayılan olarak iptal edip ilk haline döndürür.
        if (active.id !== over?.id) {
            const oldIndex = stops.findIndex((s) => s.id.toString() === active.id);
            const newIndex = stops.findIndex((s) => s.id.toString() === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                onChange(arrayMove(stops, oldIndex, newIndex));
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={stops.map((s) => s.id.toString())}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col flex-1 w-full max-h-48 overflow-y-auto pr-1">
                    {stops.map((stop, index) => (
                        <SortableStopItem
                            key={stop.id}
                            stop={stop}
                            index={index}
                            onRemove={onRemove}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
