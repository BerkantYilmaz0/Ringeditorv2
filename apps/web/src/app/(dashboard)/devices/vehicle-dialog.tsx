import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { createVehicle, updateVehicle, Vehicle } from '@/lib/devices';
import { getDrivers, Driver } from '@/lib/drivers';

const vehicleSchema = z.object({
    plate: z.string().min(1, 'Plaka zorunludur'),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    year: z.coerce.number().nullable().optional(),
    color: z.string().nullable().optional(),
    trackerId: z.string().nullable().optional(),
    simNumber: z.string().nullable().optional(),
    driverId: z.string().nullable().optional(),
    isActive: z.boolean(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicle: Vehicle | null;
    onSuccess: () => void;
}

export default function VehicleDialog({
    open,
    onOpenChange,
    vehicle,
    onSuccess,
}: VehicleDialogProps) {
    const isEditing = !!vehicle;
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);

    const form = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            plate: '',
            brand: '',
            model: '',
            year: undefined,
            color: '',
            trackerId: '',
            simNumber: '',
            driverId: 'none',
            isActive: true,
        },
    });

    useEffect(() => {
        if (open) {
            fetchDrivers();
            if (vehicle) {
                form.reset({
                    plate: vehicle.plate,
                    brand: vehicle.brand || '',
                    model: vehicle.model || '',
                    year: vehicle.year || undefined,
                    color: vehicle.color || '',
                    trackerId: vehicle.trackerId || '',
                    simNumber: vehicle.simNumber || '',
                    driverId: vehicle.driverId || 'none',
                    isActive: vehicle.isActive,
                });
            } else {
                form.reset({
                    plate: '',
                    brand: '',
                    model: '',
                    year: undefined,
                    color: '',
                    trackerId: '',
                    simNumber: '',
                    driverId: 'none',
                    isActive: true,
                });
            }
        }
    }, [open, vehicle, form]);

    const fetchDrivers = async () => {
        try {
            setLoadingDrivers(true);
            const data = await getDrivers();
            setDrivers(data);
        } catch (error) {
            console.error('Şoförler yüklenemedi:', error);
        } finally {
            setLoadingDrivers(false);
        }
    };

    const onSubmit = async (values: VehicleFormValues) => {
        try {
            // driverId "none" ise null olarak gönder
            const payload = { ...values };
            if (payload.driverId === 'none') {
                payload.driverId = null;
            }

            if (isEditing && vehicle) {
                await updateVehicle(vehicle.id, payload as Partial<Vehicle>);
            } else {
                await createVehicle(payload as Partial<Vehicle>);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error('Araç kaydedilemedi:', error);
            alert((error as Error).message || 'Kayıt işlemi başarısız!');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-slate-100 p-0 overflow-hidden bg-white">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
                        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <DialogTitle className="text-xl font-semibold text-slate-800">
                                {isEditing ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Aracın temel bilgilerini, cihaz sensör eşleşmelerini ve atamalarını buradan yönetebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-6 overflow-y-auto space-y-6">
                            {/* Temel Bilgiler */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Temel Bilgiler</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="plate"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-slate-700">Plaka</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Örn: 34 ABC 123" {...field} className="border-slate-200" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="brand"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-slate-700">Marka</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Mercedes, Isuzu vb." {...field} value={field.value || ''} className="border-slate-200" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-slate-700">Model</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Sprinter" {...field} value={field.value || ''} className="border-slate-200" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="year"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-slate-700">Model Yılı</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="2023"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                                        className="border-slate-200"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Cihaz ve Sürücü */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Sistem ve Atama</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="trackerId"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-slate-700">GPS Tracker ID</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Cihaz IMEI/Seri No" {...field} value={field.value || ''} className="border-slate-200" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="driverId"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-slate-700">Şoför Ataması</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || 'none'} disabled={loadingDrivers}>
                                                    <FormControl>
                                                        <SelectTrigger className="border-slate-200">
                                                            <SelectValue placeholder="Şoför Seçin" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">Atanmamış (Boş)</SelectItem>
                                                        {drivers.map(d => (
                                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50/30">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base text-slate-800">Sistemde Aktif Mi?</FormLabel>
                                                    <DialogDescription className="text-xs">
                                                        Pasife alınan araçlara sefer ataması yapılamaz.
                                                    </DialogDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 mt-auto flex sm:justify-between items-center">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200 text-slate-600 hover:text-slate-900">
                                İptal
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-primary hover:bg-primary/90 text-white">
                                {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
