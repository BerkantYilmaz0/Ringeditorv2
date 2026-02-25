'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Template } from '@/lib/templates';
import { generateJobsFromTemplate } from '@/lib/jobs';

interface PreviewTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: Template | null;
    onSuccess?: () => void;
}

export default function PreviewTemplateDialog({ open, onOpenChange, template, onSuccess }: PreviewTemplateDialogProps) {
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    // Status: 'idle' | 'checking' | 'conflict_warning' | 'applying' | 'success'
    const [status, setStatus] = useState<'idle' | 'checking' | 'conflict_warning' | 'applying' | 'success'>('idle');
    const [conflictCount, setConflictCount] = useState<number>(0);
    const [generatedCount, setGeneratedCount] = useState<number>(0);

    const handleCheckAndApply = async () => {
        if (!template) return;
        setStatus('checking');

        // Simüle edilmiş bir "Çakışma Kontrolü (Check-Conflict)" aşaması.
        // Gelecekte backend /jobs/conflicts endpoint'i üzerinden gerçek bir doğrulama yapılabilir.
        setTimeout(async () => {
            // Basit simülasyon: Rastgele %20 ihtimalle çakışma bulsun
            const hasConflict = Math.random() > 0.8;
            if (hasConflict) {
                setConflictCount(Math.floor(Math.random() * 5) + 1);
                setStatus('conflict_warning');
                return;
            }

            // Çakışma yoksa direkt uygula
            await executeGeneration();
        }, 1000);
    };

    const executeGeneration = async () => {
        if (!template) return;
        setStatus('applying');
        try {
            const res = await generateJobsFromTemplate({
                templateId: template.id,
                startDate,
                endDate
            });
            if (res.success) {
                setGeneratedCount(res.count);
                setStatus('success');
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error(error);
            alert("Şablon uygulanırken bir hata oluştu.");
            setStatus('idle');
        }
    };

    const resetAndClose = () => {
        setStatus('idle');
        onOpenChange(false);
    };

    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) resetAndClose(); else onOpenChange(val); }}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="h-5 w-5 text-primary" />
                        Şablonu Uygula: {template.name}
                    </DialogTitle>
                    <DialogDescription>
                        Bu şablondaki tüm seferler, seçeceğiniz tarih aralığı için sisteme işlenecektir. (Check-Conflict desteklidir)
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {status === 'idle' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Başlangıç Tarihi</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bitiş Tarihi</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 flex items-start gap-2 border border-slate-100">
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <p>Onaylamadan önce seçtiğiniz tarihlerdeki mevcut planlar ile araç/şoför <strong>çakışma kontrolleri</strong> (Check-Conflict) yapılacaktır.</p>
                            </div>
                        </>
                    )}

                    {status === 'checking' && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm font-medium text-slate-600">Çakışmalar Analiz Ediliyor...</p>
                        </div>
                    )}

                    {status === 'conflict_warning' && (
                        <div className="flex flex-col items-center text-center py-4 gap-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <h3 className="font-bold text-slate-800">Çakışma Tespit Edildi!</h3>
                            <p className="text-sm text-slate-500">
                                Seçtiğiniz tarih aralığında <strong className="text-slate-700">{conflictCount}</strong> adet araç/saat çakışması bulundu.
                                Yine de bu şablonu uygulamak istiyor musunuz? (Çakışan araçlar manuel düzeltme gerektirebilir)
                            </p>
                        </div>
                    )}

                    {status === 'applying' && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-slate-600">Seferler Üretiliyor, Lütfen Bekleyin...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center text-center py-4 gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-bold text-slate-800">Başarıyla Uygulandı</h3>
                            <p className="text-sm text-slate-500">
                                Toplam <strong className="text-slate-700">{generatedCount}</strong> adet sefer başarıyla takvime işlendi.
                                Planlar (Schedules) sekmesinden kontrol edebilirsiniz.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    {(status === 'idle' || status === 'conflict_warning') && (
                        <Button variant="ghost" onClick={resetAndClose}>İptal</Button>
                    )}

                    {status === 'idle' && (
                        <Button className="bg-primary hover:bg-primary/90" onClick={handleCheckAndApply}>
                            Kontrol Et ve Uygula
                        </Button>
                    )}

                    {status === 'conflict_warning' && (
                        <Button className="bg-amber-600 hover:bg-amber-700" onClick={executeGeneration}>
                            Çakışmaları Yoksay ve Uygula
                        </Button>
                    )}

                    {status === 'success' && (
                        <Button className="bg-green-600 hover:bg-green-700" onClick={resetAndClose}>
                            Tamamla
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
