'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { bulkCreateTemplateJobs, TemplateJob } from '@/lib/templates';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BulkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    baseJob: TemplateJob | null;
    existingJobs: TemplateJob[];
    onSaved: () => void;
}

export default function BulkDialog({ open, onOpenChange, baseJob, existingJobs, onSaved }: BulkDialogProps) {
    const [endTime, setEndTime] = useState<string>('');
    const [frequency, setFrequency] = useState<number>(20);
    const [previewChips, setPreviewChips] = useState<{ timeStr: string, timeVal: number, isConflict: boolean }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [startTimeStr, setStartTimeStr] = useState<string>('');
    const [isPushed, setIsPushed] = useState(false);

    useEffect(() => {
        if (open && baseJob) {
            setEndTime('');
            setFrequency(20);
            setPreviewChips([]);
            setIsPushed(false);

            // Başlangıç saatini belirle ve çakışma varsa otomaitk ötele
            const d = new Date(Number(baseJob.dueTime));
            const startVal = d.getTime();

            // Eğer aynı araç ve ring tipe sahip ve saat/dakikası aynı olan başka kayıt varsa, o saatte ekleme yapmamak için start time'ı frekans kadar ötele
            // Fakat baz seferin `id` si farklıdır, kendi kendini engellemez. 
            // Kullanıcı bu diyalog ile baz seferden SONRAKİ saatleri üretmek istiyor.

            // Kullanıcı genelde ilk seferi saat 08:00'e ekler ve "Birden Fazla Ekle"ye basar.
            // Başlangıç kilitlidir. 
            setStartTimeStr(format(new Date(startVal), 'HH:mm'));
        }
    }, [open, baseJob]);

    const handlePreview = () => {
        if (!baseJob) return;
        if (!endTime) {
            alert('Lütfen bitiş saati giriniz.');
            return;
        }
        if (frequency < 1 || frequency > 180) {
            alert('Sıklık 1-180 dakika arasında olmalıdır.');
            return;
        }

        const [startH, startM] = startTimeStr.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        const currentVal = new Date(0);
        // Zaman dilimi çakışmasını önlemek için Lokal (Yerel) saat kullanın!
        currentVal.setHours(startH, startM, 0, 0);

        const endValDate = new Date(0);
        endValDate.setHours(endH, endM, 0, 0);

        // Eğer kullanıcı 23:50 girip sonunu 01:00 seçtiyse, bitiş tarihi aslında 1 gün sonradır. (24 saat formatı gece sarması)
        if (endValDate.getTime() <= currentVal.getTime()) {
            endValDate.setDate(endValDate.getDate() + 1);
        }

        const generated = [];

        // İlk sefer baz olduğu için atlanabilir fakat listede görmek güzel.
        // Ancak bulk insert API'sine de gönderebiliriz. Sadece çakışma kontrolü yapacağız.
        currentVal.setMinutes(currentVal.getMinutes() + frequency);

        let iterCount = 0;
        while (currentVal.getTime() <= endValDate.getTime()) {
            iterCount++;
            if (iterCount > 100) {
                alert('Maksimum 100 sefer sınırı aşıldı! Lütfen aralığı/sıklığı güncelleyiniz.');
                break;
            }

            const tz = currentVal.getTime();
            // Ekranda yerel saatin doğru görünmesi format() ile
            const formatStr = format(currentVal, 'HH:mm');

            // Çakışma kontrolü: Zaten bu template'te, bu plaka ve ring tipi ile bu saate sahip bir sefer var mı?
            const isConflict = existingJobs.some(j => {
                if (j.id === baseJob.id) return false;
                if (j.vehicleId !== baseJob.vehicleId) return false;

                const jDate = new Date(Number(j.dueTime));
                return format(jDate, 'HH:mm') === formatStr;
            });

            generated.push({
                timeStr: formatStr,
                timeVal: tz,
                isConflict
            });

            currentVal.setMinutes(currentVal.getMinutes() + frequency);
        }

        setPreviewChips(generated);
    };

    const handleSave = async () => {
        if (!baseJob) return;
        const validChips = previewChips.filter(c => !c.isConflict);
        if (validChips.length === 0) {
            alert('Eklenecek yeni sefer yok veya tüm saatler çakışıyor.');
            return;
        }

        setIsSaving(true);
        try {
            const items = validChips.map(c => ({
                templateId: baseJob.templateId,
                dueTime: c.timeVal,
                ringTypeId: baseJob.ringTypeId,
                routeId: baseJob.routeId,
                vehicleId: baseJob.vehicleId,
                status: 1
            }));

            await bulkCreateTemplateJobs(baseJob.templateId, items);
            alert(`${items.length} sefer başarıyla eklendi.`);
            onSaved();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error(error);
            alert((error as Error).message || 'Toplu ekleme sırasında bir hata oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    if (!baseJob) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Birden Fazla Sefer Ekle</DialogTitle>
                    <DialogDescription className="sr-only">
                        Belirli periyotlarla toplu yeni seferler oluşturmak için ayarları yapın.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 space-y-1 mt-2">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Baz Sefer Bilgileri</div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">Ring:</span>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: baseJob.ringType?.color || '#000' }} /> <span className="font-bold">{baseJob.ringType?.name}</span></div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">Güzergah:</span>
                        <span className="font-bold text-slate-800">{baseJob.route?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">Plaka:</span>
                        <span className="font-bold font-mono tracking-widest text-slate-800">{baseJob.vehicle?.plate || '—'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500 font-bold">Başlangıç Saati</Label>
                        <Input type="time" disabled value={startTimeStr} className="bg-slate-100 font-mono" />
                        {isPushed && <span className="text-[10px] text-amber-600">⚠️ Otomatik kaydırıldı</span>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500 font-bold">Bitiş Saati *</Label>
                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="font-mono bg-white" />
                    </div>
                </div>

                <div className="mb-6 space-y-1.5">
                    <Label className="text-xs text-slate-500 font-bold">Sıklık (Dakika) *</Label>
                    <Input type="number" min={1} max={180} value={frequency} onChange={e => setFrequency(parseInt(e.target.value) || 0)} className="bg-white" />
                </div>

                <div className="flex justify-center mb-4">
                    <Button variant="outline" className="w-full font-bold text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handlePreview}>Önizleme Hesapla</Button>
                </div>

                {previewChips.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-2 max-h-48 overflow-y-auto">
                        <div className="text-xs font-bold text-slate-600 mb-2">
                            Önizleme ({previewChips.length} Sefer Üretildi)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {previewChips.map((c, idx) => (
                                <Badge key={idx} variant={c.isConflict ? "outline" : "default"} className={`font-mono ${c.isConflict ? 'text-amber-600 border-amber-200 bg-amber-50 line-through' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {c.timeStr}
                                </Badge>
                            ))}
                        </div>
                        {previewChips.some(c => c.isConflict) && (
                            <div className="mt-3 text-[11px] font-semibold text-amber-600 flex items-center gap-1.5">
                                ⚠️ Üzeri çizili saatlerde (çakışma var) ekleme yapılmayacaktır.
                            </div>
                        )}
                        {!previewChips.some(c => !c.isConflict) && previewChips.length > 0 && (
                            <div className="mt-3 text-[11px] font-bold text-red-500">
                                Kaydedilmeye uygun yeni saat bulunamadı. Lütfen sıklık değerlerini değiştirin.
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="mt-6">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button
                        disabled={previewChips.length === 0 || !previewChips.some(c => !c.isConflict) || isSaving}
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 font-bold px-6"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Seferleri Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
