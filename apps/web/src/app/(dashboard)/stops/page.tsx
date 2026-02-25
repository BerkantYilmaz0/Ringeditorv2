'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getStops, createStop, deleteStop, Stop } from '@/lib/stops';
import { Route } from '@/lib/routes';

import {
    MapPin,
    Plus,
    Trash2,
    Search,
    Loader2,
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Harita bileşenini SSR olmadan (Client Side) yüklüyoruz
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Harita yükleniyor...
        </div>
    )
});

const stopSchema = z.object({
    name: z.string().min(1, 'Durak adı zorunludur'),
    description: z.string().optional(),
    lat: z.coerce.number().min(-90).max(90, 'Geçersiz Enlem'),
    lng: z.coerce.number().min(-180).max(180, 'Geçersiz Boylam'),
});

type StopFormValues = z.infer<typeof stopSchema>;

export default function StopsPage() {
    const [stops, setStops] = useState<Stop[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]); // Şebeke görünümü için
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStopId, setSelectedStopId] = useState<number | null>(null);

    const form = useForm<StopFormValues>({
        resolver: zodResolver(stopSchema),
        defaultValues: {
            name: '',
            description: '',
            lat: 39.92077, // Varsayılan: Ankara
            lng: 32.85411,
        }
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [stopsRes, routesRes] = await Promise.all([
                getStops(1, 500),
                import('@/lib/routes').then(m => m.getRoutes(1, 100))
            ]);
            setStops(stopsRes.stops);
            setRoutes(routesRes.routes);
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Haritaya tıklandığında koordinatları forma doldur
    const handleMapClick = (lat: number, lng: number) => {
        form.setValue('lat', parseFloat(lat.toFixed(6)));
        form.setValue('lng', parseFloat(lng.toFixed(6)));
    };

    const handleCreateStop = async (values: StopFormValues) => {
        try {
            const newStop = await createStop(values);
            setStops([...stops, newStop]);
            form.reset({
                name: '',
                description: '',
                lat: values.lat,
                lng: values.lng
            });
            alert('Durak başarıyla eklendi!');
        } catch (error: unknown) {
            console.error('Durak eklenemedi:', error);
            alert((error as Error).message || 'Ekleme başarısız!');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bu durağı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteStop(id);
            setStops(stops.filter(s => s.id !== id));
            if (selectedStopId === id) setSelectedStopId(null);
        } catch (error: unknown) {
            console.error('Durak silinemedi:', error);
            alert((error as Error).message || 'Silme işlemi başarısız');
        }
    };

    const filteredStops = stops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">

            {/* Sol Panel: Liste ve Form */}
            <div className="w-full md:w-[400px] flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-4">

                {/* Yeni Durak Ekleme Kartı */}
                <Card className="border-slate-200 shadow-sm shrink-0">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Yeni Durak Ekle
                        </CardTitle>
                        <CardDescription>
                            Haritaya tıklayarak koordinat seçebilir veya elle girebilirsiniz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreateStop)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Durak Adı</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Örn: A Kapısı, Hazırlık..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="lat"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700">Enlem (Lat)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="any" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lng"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700">Boylam (Lng)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="any" {...field} />
                                                </FormControl>
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
                                                <Input placeholder="Notlar..." {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Ekleniyor...' : 'Durağı Kaydet'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Duraklar Listesi */}
                <Card className="border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[300px]">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 shrink-0">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Kayıtlı Duraklar
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Durak ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-white"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-6 text-center text-slate-500">Yükleniyor...</div>
                        ) : filteredStops.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">Durak bulunamadı.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredStops.map(stop => (
                                    <div
                                        key={stop.id}
                                        className={`p-4 flex items-start justify-between hover:bg-slate-50 transition-colors cursor-pointer group ${selectedStopId === stop.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                                        onClick={() => setSelectedStopId(stop.id)}
                                    >
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{stop.name}</h4>
                                            <p className="text-xs text-slate-500 font-mono mt-1">
                                                {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(stop.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* Sağ Panel: Harita */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[400px] md:h-full relative z-0">
                <MapComponent
                    stops={stops}
                    onMapClick={handleMapClick}
                    onMarkerClick={setSelectedStopId}
                    selectedStopId={selectedStopId}
                    center={[39.92077, 32.85411]} // Varsayılan konum
                    backgroundGeometries={routes
                        .filter(r => r.geometry)
                        .map(r => ({ id: r.id, geometry: r.geometry! }))}
                />
            </div>

        </div>
    );
}
