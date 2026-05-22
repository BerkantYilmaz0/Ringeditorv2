'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createDriver, updateDriver, DriverCreateInput, Driver } from '@/lib/drivers';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    driver?: Driver | null;
    onClose: () => void;
    onSaved: () => void;
}

type FormValues = {
    name: string;
    phone: string;
    licenseType: string;
    licenseExpiry: string;
    address: string;
    notes: string;
};

export default function DriverDialog({ open, driver, onClose, onSaved }: Props) {
    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<FormValues>();

    useEffect(() => {
        if (open) {
            reset({
                name: driver?.name ?? '',
                phone: driver?.phone ?? '',
                licenseType: driver?.licenseType ?? '',
                licenseExpiry: driver?.licenseExpiry ? driver.licenseExpiry.substring(0, 10) : '',
                address: driver?.address ?? '',
                notes: driver?.notes ?? '',
            });
        }
    }, [open, driver, reset]);

    async function onSubmit(values: FormValues) {
        try {
            const data: DriverCreateInput = {
                name: values.name,
                phone: values.phone || undefined,
                licenseType: values.licenseType || undefined,
                licenseExpiry: values.licenseExpiry || undefined,
                address: values.address || undefined,
                notes: values.notes || undefined,
            };
            if (driver) {
                await updateDriver(driver.id, data);
                toast.success('Sürücü güncellendi');
            } else {
                await createDriver(data);
                toast.success('Sürücü oluşturuldu');
            }
            onSaved();
        } catch {
            toast.error('İşlem başarısız');
        }
    }

    const LICENSE_TYPES = ['A', 'A1', 'A2', 'B', 'B1', 'C', 'C1', 'D', 'D1', 'E', 'F', 'G'];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{driver ? 'Sürücü Düzenle' : 'Yeni Sürücü'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="space-y-1">
                        <Label>Ad Soyad *</Label>
                        <Input {...register('name', { required: true })} placeholder="Ad Soyad" />
                    </div>
                    <div className="space-y-1">
                        <Label>Telefon</Label>
                        <Input {...register('phone')} placeholder="+90 5xx xxx xx xx" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Ehliyet Tipi</Label>
                            <Select defaultValue={driver?.licenseType ?? ''} onValueChange={(v) => setValue('licenseType', v)}>
                                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                                <SelectContent>
                                    {LICENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Ehliyet Bitiş</Label>
                            <Input type="date" {...register('licenseExpiry')} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Adres</Label>
                        <Input {...register('address')} placeholder="Adres" />
                    </div>
                    <div className="space-y-1">
                        <Label>Notlar</Label>
                        <textarea {...register('notes')} placeholder="Notlar..." rows={2} className="rp-input" style={{ resize: 'vertical' }} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
