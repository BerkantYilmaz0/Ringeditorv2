'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import { Job } from '@/lib/jobs';
import { format } from 'date-fns';

interface SchedulerViewProps {
    date: string;
    jobs: Job[];
    onEventClick: (job: Job) => void;
    onSlotClick: (time: string) => void;
    onEventDrop: (job: Job, newStartTime: Date) => void;
}

export default function SchedulerView({ date, jobs, onEventClick, onSlotClick, onEventDrop }: SchedulerViewProps) {
    // Job verilerini FullCalendar eventlerine dönüştür
    const events = React.useMemo(() => jobs.map(job => {
        const startTime = new Date(Number(job.dueTime));
        // Her seferi görsel olarak 10 dakikalık bir blok gibi gösterelim (1 slot)
        const endTime = new Date(startTime.getTime() + 10 * 60 * 1000);

        return {
            id: job.id.toString(),
            title: `${job.route?.name || 'Bilinmeyen Hat'} (${job.vehicle?.plate || 'Otomatik'})`,
            start: startTime,
            end: endTime,
            backgroundColor: '#f8fafc', // Çok açık gri / beyaz
            borderColor: '#e2e8f0',
            textColor: '#334155', // slate-700
            extendedProps: {
                job,
                ringColor: job.route?.color || '#3b82f6'
            }
        };
    }), [jobs]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 h-full relative overflow-hidden flex flex-col">
            <style jsx global>{`
                .fc-v-event {
                    border-radius: 4px !important;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
                    border: 1px solid #e2e8f0 !important;
                    padding: 0 !important;
                    width: 10% !important;
                }
                .fc-event-main {
                    padding: 0 !important;
                    display: flex;
                    align-items: center;
                }
                .fc-event-title {
                    font-size: 0.7rem !important;
                    font-weight: 600 !important;
                    color: #334155 !important;
                }
                .fc-timegrid-slot {
                    height: 22px !important; 
                }
                .fc-timegrid-axis-cushion, .fc-timegrid-slot-label-cushion {
                    font-size: 0.6rem !important;
                    font-weight: 600 !important;
                    color: #94a3b8 !important;
                }
                .fc-timegrid-now-indicator-line {
                    border-color: #ef4444 !important;
                    border-width: 2px !important;
                }
                
            `}</style>

            <FullCalendar
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
                initialDate={date}
                locale={trLocale}
                headerToolbar={false}
                events={events}
                allDaySlot={false}
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                slotDuration={{ minutes: 10 }}
                slotLabelInterval={{ minutes: 10 }}
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: false
                }}
                nowIndicator={true}
                height="100%"
                editable={true}
                eventStartEditable={true}
                eventDurationEditable={false} // Sefer süresini sabit tutuyoruz
                eventContent={(eventInfo) => {
                    const timeStr = eventInfo.event.start ? format(eventInfo.event.start, 'HH:mm') : '';
                    return (
                        <div className="flex flex-col justify-center px-1.5 py-0.5 h-full w-full overflow-hidden leading-tight">
                            <div className="flex items-center gap-1.5 truncate">
                                <div
                                    className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: eventInfo.event.extendedProps.ringColor }}
                                />
                                <span className="font-bold text-[10px] text-slate-800">
                                    {timeStr}
                                </span>
                                <span className="truncate text-[10px] text-slate-600 font-medium">
                                    {eventInfo.event.title}
                                </span>
                            </div>
                        </div>
                    );
                }}
                eventClick={(info) => onEventClick(info.event.extendedProps.job)}
                eventDrop={(info) => {
                    const job = info.event.extendedProps.job;
                    if (info.event.start) {
                        onEventDrop(job, info.event.start);
                    }
                }}
                dateClick={(info) => {
                    const timeStr = format(info.date, 'HH:mm');
                    onSlotClick(timeStr);
                }}
            />
        </div>
    );
}
