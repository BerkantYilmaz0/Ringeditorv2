'use client';

import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { Job } from '@/lib/jobs';
import { RingType } from '@/lib/ring-types';

const DAY_ABBR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// 30 dakikalık slotlar: 06:00 → 19:30 (dakika cinsinden)
// 6*60=360, 6*60+30=390, 7*60=420, ...
const SLOTS: { minutes: number; label: string; isHour: boolean }[] = [];
for (let h = 6; h <= 19; h++) {
    for (const half of [0, 1]) {
        const totalMin = h * 60 + half * 30;
        if (totalMin > 19 * 60) break;
        SLOTS.push({
            minutes: totalMin,
            label: `${String(h).padStart(2, '0')}:${half === 0 ? '00' : '30'}`,
            isHour: half === 0,
        });
    }
}

// Job'ın ait olduğu slotu minutes cinsinden döndür (30'a yuvarla)
function jobSlotMin(timestamp: number): number {
    const d = new Date(timestamp);
    const totalMin = d.getHours() * 60 + d.getMinutes();
    return Math.floor(totalMin / 30) * 30;
}

interface WeekCalendarProps {
    days: Date[];
    weekJobs: Record<string, Job[]>;
    selectedDate: string;
    activeRingTypeId: number | null;
    ringTypes: RingType[];
    onDayClick: (date: string) => void;
    onJobClick: (job: Job) => void;
    onSlotClick: (date: string, time: string) => void;
}

export default function WeekCalendar({
    days, weekJobs, selectedDate, activeRingTypeId,
    onDayClick, onJobClick, onSlotClick,
}: WeekCalendarProps) {

    const filteredWeekJobs = useMemo(() => {
        if (!activeRingTypeId) return weekJobs;
        const out: Record<string, Job[]> = {};
        Object.entries(weekJobs).forEach(([date, jobs]) => {
            out[date] = jobs.filter(j => j.route?.ringTypeId === activeRingTypeId);
        });
        return out;
    }, [weekJobs, activeRingTypeId]);

    // date → slotMinutes → Job[]
    const jobsByDateSlot = useMemo(() => {
        const m: Record<string, Record<number, Job[]>> = {};
        Object.entries(filteredWeekJobs).forEach(([date, jobs]) => {
            m[date] = {};
            jobs.forEach(j => {
                const slotMin = jobSlotMin(j.dueTime);
                if (!m[date][slotMin]) m[date][slotMin] = [];
                m[date][slotMin].push(j);
            });
            Object.values(m[date]).forEach(arr =>
                arr.sort((a, b) => a.dueTime - b.dueTime)
            );
        });
        return m;
    }, [filteredWeekJobs]);

    const plateSuffix = (plate: string) => plate.split(' ').pop() ?? plate;
    const colGrid = '64px repeat(7, minmax(0,1fr))';

    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>

            {/* ── Gün başlıkları ── */}
            <div style={{
                display: 'grid', gridTemplateColumns: colGrid,
                borderBottom: '2px solid var(--border)',
                position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 5,
            }}>
                <div style={{ borderRight: '1px solid var(--border)' }} />
                {days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = dateStr === selectedDate;
                    const isTodayDay = isToday(day);
                    const count = weekJobs[dateStr]?.length ?? 0;
                    return (
                        <div
                            key={i}
                            onClick={() => onDayClick(dateStr)}
                            style={{
                                padding: '14px 8px 12px', textAlign: 'center', cursor: 'pointer',
                                borderLeft: '1px solid var(--border)',
                                background: isTodayDay ? 'var(--accent-soft)' : isSelected ? 'var(--bg-2)' : 'transparent',
                                transition: 'background 0.15s',
                            }}
                        >
                            <div style={{ fontSize: 10, fontWeight: 700, color: isTodayDay ? 'var(--accent)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                {DAY_ABBR[i]}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: isTodayDay ? 'var(--accent)' : 'var(--ink)', marginBottom: 4 }}>
                                {format(day, 'd')}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                                {count > 0 ? `${count} sefer` : <span style={{ opacity: 0.35 }}>—</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── 30 dakikalık slotlar ── */}
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 360px)', minHeight: 300 }}>
                {SLOTS.map(slot => {
                    return (
                        <div
                            key={slot.minutes}
                            style={{
                                display: 'grid', gridTemplateColumns: colGrid,
                                borderBottom: slot.isHour
                                    ? '1px solid var(--border)'
                                    : '1px dashed rgba(0,0,0,0.06)',
                                minHeight: 34,
                            }}
                        >
                            {/* Saat etiketi — tam saatlerde görünür, yarım saatte silik */}
                            <div style={{
                                borderRight: '1px solid var(--border)',
                                padding: '5px 10px 0',
                                fontSize: 10.5,
                                fontFamily: '"JetBrains Mono",monospace',
                                color: slot.isHour ? 'var(--ink-3)' : 'rgba(0,0,0,0.2)',
                                fontWeight: 500,
                                textAlign: 'right',
                                alignSelf: 'flex-start',
                                userSelect: 'none',
                            }}>
                                {slot.label}
                            </div>

                            {days.map((day, di) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const isTodayDay = isToday(day);
                                // numeric key lookup — tam eşleşme garantili
                                const cellJobs = jobsByDateSlot[dateStr]?.[slot.minutes] ?? [];
                                return (
                                    <div
                                        key={di}
                                        onClick={() => {
                                            if (cellJobs.length === 0) onSlotClick(dateStr, slot.label);
                                            else onDayClick(dateStr);
                                        }}
                                        style={{
                                            borderLeft: '1px solid var(--border)',
                                            background: isTodayDay ? 'rgba(13,148,136,0.025)' : 'transparent',
                                            padding: cellJobs.length ? '3px 4px' : 0,
                                            cursor: 'pointer',
                                            minHeight: 34,
                                        }}
                                    >
                                        {cellJobs.map(j => {
                                            const color = j.route?.color || j.route?.ringType?.color || '#0d9488';
                                            const timeStr = format(new Date(j.dueTime), 'HH:mm');
                                            const plate = plateSuffix(j.vehicle?.plate ?? '—');
                                            return (
                                                <div
                                                    key={j.id}
                                                    onClick={e => { e.stopPropagation(); onJobClick(j); }}
                                                    title={`${timeStr} · ${j.route?.name ?? ''} · ${j.vehicle?.plate ?? ''}`}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                        padding: '2px 5px 2px 6px',
                                                        marginBottom: 2,
                                                        borderLeft: `3px solid ${color}`,
                                                        borderRadius: '0 4px 4px 0',
                                                        background: 'var(--bg-2)',
                                                        cursor: 'pointer', overflow: 'hidden',
                                                    }}
                                                >
                                                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, color: 'var(--ink)', fontSize: 10, flexShrink: 0 }}>
                                                        {timeStr}
                                                    </span>
                                                    <span style={{ color: 'var(--ink-3)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {plate}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
