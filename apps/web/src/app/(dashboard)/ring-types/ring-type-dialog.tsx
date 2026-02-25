import { useEffect } from 'react';
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

import { createRingType, updateRingType, RingType } from '@/lib/ring-types';

const ringTypeSchema = z.object({
    name: z.string().min(1, 'Ring adı zorunludur'),
    description: z.string().nullable().optional(),
    typeId: z.coerce.number().min(1, 'Geçerli bir Tip Kodu (ID) giriniz'),
    color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Geçerli bir Hex renk kodu giriniz (#000000)').optional(),
});

type RingTypeFormValues = z.infer<typeof ringTypeSchema>;

interface RingTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ringType: RingType | null;
    onSuccess: () => void;
}

export default function RingTypeDialog({
    open,
    onOpenChange,
    ringType,
    onSuccess,
}: RingTypeDialogProps) {
    const isEditing = !!ringType;

    const form = useForm<RingTypeFormValues>({
        resolver: zodResolver(ringTypeSchema),
        defaultValues: {
            name: '',
            description: '',
            typeId: 0,
            color: '#0d9488', // Varsayılan Teal rengi
        },
    });

    useEffect(() => {
        if (open) {
            if (ringType) {
                form.reset({
                    name: ringType.name,
                    description: ringType.description || '',
                    typeId: ringType.typeId,
                    color: ringType.color || '#0d9488',
                });
            } else {
                form.reset({
                    name: '',
                    description: '',
                    typeId: 0,
                    color: '#0d9488',
                });
            }
        }
    }, [open, ringType, form]);

    const onSubmit = async (values: RingTypeFormValues) => {
        try {
            if (isEditing && ringType) {
                await updateRingType(ringType.id, values as Partial<RingType>);
            } else {
                await createRingType(values as Partial<RingType>);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error('Ring tipi kaydedilemedi:', error);
            alert((error as Error).message || 'Kayıt işlemi başarısız!');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-slate-100 p-0 overflow-hidden bg-white">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
                        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <DialogTitle className="text-xl font-semibold text-slate-800">
                                {isEditing ? 'Ring Tipini Düzenle' : 'Yeni Ring Tipi'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Güzargah ve sefer atamalarında kullanılacak Ring tipini belirleyin.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-6 overflow-y-auto space-y-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Ring Adı</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Örn: Personel Servisi, Ring 1..." {...field} className="border-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="typeId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 sm:col-span-1">
                                            <FormLabel className="text-slate-700">Tip Kodu (ID)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="1, 2, 3 vb."
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

                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 sm:col-span-1">
                                            <FormLabel className="text-slate-700">Hat Rengi</FormLabel>
                                            <div className="flex gap-2 items-center">
                                                <FormControl>
                                                    <Input
                                                        type="color"
                                                        {...field}
                                                        className="w-12 h-10 p-1 border-slate-200 cursor-pointer"
                                                    />
                                                </FormControl>
                                                <Input
                                                    type="text"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="border-slate-200 uppercase font-mono text-sm"
                                                />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Açıklama (Opsiyonel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Kısa bir not..." {...field} value={field.value || ''} className="border-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 mt-auto flex justify-end gap-2 items-center">
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
