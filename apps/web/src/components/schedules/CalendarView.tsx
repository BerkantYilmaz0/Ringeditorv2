'use client';

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import { getJobsCalendarStats } from '@/lib/jobs';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface CalendarViewProps {
    onDateSelect: (date: string) => void;
}

export default function CalendarView({ onDateSelect }: CalendarViewProps) {
    const [stats, setStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    const fetchStats = async (month: string) => {
        setLoading(true);
        try {
            const data = await getJobsCalendarStats(month);
            setStats(data as Record<string, number>);
        } catch (error) {
            console.error('Takvim istatistikleri çekilemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const currentMonth = format(new Date(), 'yyyy-MM');
        fetchStats(currentMonth);
    }, []);

    // Sefer sayılarını FullCalendar eventleri olarak hazırla
    const events = Object.entries(stats).map(([date, count]) => ({
        title: `${count} sefer mevcut`,
        start: date,
        allDay: true,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: '#64748b', // slate-500
        extendedProps: { count }
    }));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full relative overflow-hidden">
            {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            <style jsx global>{`
                .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-daygrid-event-dot-width: 4px;
                    font-family: inherit;
                }
                .fc .fc-toolbar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #0f172a;
                    text-transform: capitalize;
                }
                .fc .fc-button-primary {
                    background-color: white;
                    border-color: #e2e8f0;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: capitalize;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                }
                .fc .fc-button-primary:hover {
                    background-color: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active {
                    background-color: #f1f5f9;
                    border-color: #cbd5e1;
                    color: #0f172a;
                }
                .fc .fc-col-header-cell-cushion {
                    padding: 12px 4px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .fc .fc-daygrid-day-number {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #64748b;
                    padding: 8px;
                }
                .fc .fc-day-today {
                    background-color: #f0f9ff !important;
                }
                .fc .fc-day-today .fc-daygrid-day-number {
                    color: #0ea5e9;
                    font-weight: 800;
                }
                .fc-event {
                    cursor: pointer;
                }
                .fc-daygrid-event {
                    margin-top: 2px !important;
                    white-space: normal !important;
                }
                .fc-event-title {
                    font-size: 0.7rem !important;
                    font-weight: 600 !important;
                    padding: 2px 4px !important;
                    background: #f1f5f9 !important;
                    border-radius: 4px !important;
                    display: inline-block !important;
                }
            `}</style>

            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={trLocale}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: ''
                }}
                events={events}
                datesSet={(arg) => {
                    const month = format(arg.view.currentStart, 'yyyy-MM');
                    fetchStats(month);
                }}
                dateClick={(arg) => onDateSelect(arg.dateStr)}
                height="100%"
                fixedWeekCount={false}
                dayMaxEvents={true}
            />
        </div>
    );
}
