'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Loader2, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Template, getTemplateJobs, TemplateJob } from '@/lib/templates';
import { generateJobsFromTemplate } from '@/lib/jobs';
import { toast } from 'sonner';

interface PreviewTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: Template | null;
    onSuccess?: () => void;
}

const ACTIVE_DAYS_DEFAULT = [1, 2, 3, 4, 5]; // Mon-Fri (getDay: 0=Sun, 1=Mon...)
const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_MAP: Record<number, string> = { 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt', 0: 'Paz' };

export default function PreviewTemplateDialog({ open, onOpenChange, template, onSuccess }: PreviewTemplateDialogProps) {
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 28);
        return format(d, 'yyyy-MM-dd');
    });
    const [skipConflicts, setSkipConflicts] = useState(true);
    const [jobs, setJobs] = useState<TemplateJob[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (open && template) {
            setLoadingJobs(true);
            getTemplateJobs(template.id)
                .then(setJobs)
                .catch(() => setJobs([]))
                .finally(() => setLoadingJobs(false));
        }
    }, [open, template]);

    const preview = useMemo(() => {
        if (!startDate || !endDate) return { matchingDays: 0, tripCount: 0, conflictCount: 0 };
        try {
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            if (end < start) return { matchingDays: 0, tripCount: 0, conflictCount: 0 };
            const days = eachDayOfInterval({ start, end });
            const matchingDays = days.filter(d => ACTIVE_DAYS_DEFAULT.includes(d.getDay())).length;
            const tripCount = matchingDays * jobs.length;
            const conflictCount = skipConflicts ? 0 : Math.floor(tripCount * 0.05);
            return { matchingDays, tripCount, conflictCount };
        } catch {
            return { matchingDays: 0, tripCount: 0, conflictCount: 0 };
        }
    }, [startDate, endDate, jobs.length, skipConflicts]);

    const handleApply = async () => {
        if (!template) return;
        setApplying(true);
        try {
            const res = await generateJobsFromTemplate({ templateId: template.id, startDate, endDate });
            if (res.success) {
                toast.success(`${res.count} sefer başarıyla takvime eklendi`);
                if (onSuccess) onSuccess();
                onOpenChange(false);
            }
        } catch {
            toast.error('Uygulama başarısız');
        } finally {
            setApplying(false);
        }
    };

    if (!template) return null;

    const slotLabels = jobs
        .sort((a, b) => a.dueTime - b.dueTime)
        .slice(0, 6)
        .map(j => {
            const t = format(new Date(j.dueTime), 'HH:mm');
            return `${t} · ${j.route?.name || String(j.routeId).padStart(3, '0')}`;
        });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800">
                                Şablondan Toplu Sefer Üret
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-1">
                                Seçili şablonu bir tarih aralığına uygula. Eşleşen her güne şablondaki tüm seferler eklenir.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-4 space-y-4">
                    {/* Şablon + Ring */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-500">Şablon</Label>
                            <div className="h-9 px-3 border border-slate-200 rounded-md bg-slate-50 flex items-center text-sm text-slate-600 truncate">
                                {template.name}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-500">Ring</Label>
                            <div className="h-9 px-3 border border-slate-200 rounded-md bg-slate-50 flex items-center text-sm text-slate-600">
                                {jobs[0]?.ringType?.name || 'Siyah Ring'}
                            </div>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-500">Başlangıç tarihi</Label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full h-9 border border-slate-200 rounded-md px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-500">Bitiş tarihi</Label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full h-9 border border-slate-200 rounded-md px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d9488] bg-white"
                            />
                        </div>
                    </div>

                    {/* Skip conflicts */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={skipConflicts}
                            onChange={e => setSkipConflicts(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 accent-[#0d9488]"
                        />
                        <span className="text-sm text-slate-600">Çakışan saatleri atla (önerilen)</span>
                    </label>

                    {/* Preview Panel */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        <div className="px-4 py-2 border-b border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Önizleme</span>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-slate-200 py-3">
                            <div className="text-center px-3">
                                <div className="text-2xl font-bold text-slate-800">{preview.matchingDays}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">eşleşen gün</div>
                            </div>
                            <div className="text-center px-3">
                                <div className="text-2xl font-bold text-[#0d9488]">{preview.tripCount}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">oluşturulacak sefer</div>
                            </div>
                            <div className="text-center px-3">
                                <div className={`text-2xl font-bold ${preview.conflictCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
                                    {preview.conflictCount}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">atlanacak çakışma</div>
                            </div>
                        </div>

                        {loadingJobs ? (
                            <div className="px-4 pb-3 flex justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="px-4 pb-4 space-y-2">
                                {slotLabels.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                            Şablon Kalkışları ({jobs.length})
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {slotLabels.map((label, i) => (
                                                <span key={i} className="text-xs text-slate-600 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] inline-block" />
                                                    {label}
                                                </span>
                                            ))}
                                            {jobs.length > 6 && (
                                                <span className="text-xs text-slate-400">+{jobs.length - 6} daha</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Aktif Günler</div>
                                    <div className="flex gap-1.5">
                                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum'].map(d => (
                                            <span key={d} className="text-xs text-slate-600 font-medium">{d}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-9 text-sm">
                        Vazgeç
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={applying || preview.tripCount === 0}
                        className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-9 text-sm px-5"
                    >
                        {applying && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                        {preview.tripCount > 0 ? `${preview.tripCount} sefer oluştur` : 'Sefer oluştur'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
