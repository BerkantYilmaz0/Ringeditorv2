'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getRoutes, createRoute, deleteRoute, Route, getOsrmRoute, GeoJSONLineString } from '@/lib/routes';
import { getStops, Stop } from '@/lib/stops';
import { getRingTypes, RingType } from '@/lib/ring-types';

import { Plus, Trash2, Search, Loader2, CheckCircle2, MapIcon, Route as RouteIcon, Sparkles } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SortableStopsList } from '@/components/routes/SortableStopsList';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Harita yükleniyor...
        </div>
    )
});

const routeSchema = z.object({
    name: z.string().min(1, 'Güzergah adı zorunludur'),
    description: z.string().optional(),
    color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Geçerli bir Hex renk kodu giriniz').optional(),
    ringTypeId: z.coerce.number().min(1, 'Ring Tipi seçimi zorunludur'),
});

type RouteFormValues = z.infer<typeof routeSchema>;

export default function RoutesPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [stops, setStops] = useState<Stop[]>([]);
    const [ringTypes, setRingTypes] = useState<RingType[]>([]);

    // Güzergah çizim states
    const [selectedStops, setSelectedStops] = useState<Stop[]>([]);
    const [routeGeometry, setRouteGeometry] = useState<GeoJSONLineString | null>(null);
    const [calculatingRoute, setCalculatingRoute] = useState(false);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

    const form = useForm<RouteFormValues>({
        resolver: zodResolver(routeSchema),
        defaultValues: {
            name: '',
            description: '',
            color: '#3b82f6',
            ringTypeId: 0,
        }
    });

    const routeColorValue = form.watch('color');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [routesRes, stopsRes, ringTypesRes] = await Promise.all([
                getRoutes(1, 100),
                getStops(1, 500),
                getRingTypes()
            ]);
            setRoutes(routesRes.routes);
            setStops(stopsRes.stops);
            setRingTypes(ringTypesRes);
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Seçilen duraklar değiştiğinde OSRM isteği at
    useEffect(() => {
        const fetchOsrm = async () => {
            if (selectedStops.length < 2) {
                setRouteGeometry(null);
                return;
            }
            setCalculatingRoute(true);
            const geometry = await getOsrmRoute(selectedStops.map(s => ({ lat: s.lat, lng: s.lng })));
            setRouteGeometry(geometry);
            setCalculatingRoute(false);
        };
        fetchOsrm();
    }, [selectedStops]);

    const handleMarkerClick = (stopId: number) => {
        const stop = stops.find(s => s.id === stopId);
        if (!stop) return;

        // Önizleme modundaysak (mevcut bir rotaya bakıyorsak) durak ekleme/çıkarma yapma
        if (selectedRouteId !== null) return;

        // Ekleme ya da çıkartma mantığı (Yeni güzergah oluştururken)
        if (selectedStops.find(s => s.id === stopId)) {
            setSelectedStops(selectedStops.filter(s => s.id !== stopId));
        } else {
            setSelectedStops([...selectedStops, stop]);
        }
    };

    const handleCreateRoute = async (values: RouteFormValues) => {
        if (selectedStops.length < 2) {
            alert('Lütfen haritadan en az 2 adet durak seçin!');
            return;
        }

        try {
            const stopsData = selectedStops.map((s, idx) => ({ stopId: s.id, sequence: idx + 1 }));
            const newRoute = await createRoute({
                ...values,
                geometry: routeGeometry,
                stops: stopsData
            });

            // Yeni rotayı ringTypes içinden isim eşleyerek ufak bir fixle listeye ekle
            const rType = ringTypes.find(rt => rt.id === values.ringTypeId);
            newRoute.ringType = rType;

            setRoutes([newRoute, ...routes]);
            setSelectedStops([]);
            setRouteGeometry(null);
            form.reset({
                name: '',
                description: '',
                color: '#3b82f6',
                ringTypeId: 0,
            });
            alert('Güzergah başarıyla oluşturuldu!');
        } catch (error: unknown) {
            console.error('Güzergah oluşturma hatası:', error);
            alert((error as Error).message || 'Ekleme başarısız!');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bu güzergahı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteRoute(id);
            setRoutes(routes.filter(r => r.id !== id));
            if (selectedRouteId === id) setSelectedRouteId(null);
        } catch (error: unknown) {
            console.error('Güzergah silinemedi:', error);
            alert((error as Error).message || 'Silme işlemi başarısız');
        }
    };

    // Sol panel listesinde bir rotaya tıklandığında önizlemesi yapılsın
    const handleRoutePreview = (route: Route) => {
        if (selectedRouteId === route.id) {
            setSelectedRouteId(null);
            setSelectedStops([]);
            setRouteGeometry(null);
        } else {
            setSelectedRouteId(route.id);
            // Rotanın duraklarını sırasıyla selectedStops stateine aktarıyoruz (sadece önizleme amaçlı)
            const routeStopsList = route.stops?.map(rs => rs.stop).filter(Boolean) as Stop[] || [];
            setSelectedStops(routeStopsList);
            // Mevcut db geometrysi varsa onu basıyoruz (Tekrar OSRM çağrılmasını engellemek için)
            setRouteGeometry(route.geometry);
        }
    };

    const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">

            {/* Sol Panel: Liste ve Form */}
            <div className="w-full md:w-[450px] flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-4 relative z-50">

                {/* Güzergah Oluşturma Formu */}
                <Card className="border-slate-200 shadow-sm shrink-0 relative z-50">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                        <CardTitle className="text-lg text-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Yeni Hat Oluştur</span>
                            {calculatingRoute && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 animate-pulse">
                                    <Sparkles className="h-3 w-3" />
                                    <span>AI Rota Çiziliyor...</span>
                                </div>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Haritadaki duraklara **sırasıyla tıklayarak** veya listeden sürükleyip bırakarak (drag&drop) güzergah rotasını belirleyebilirsiniz. OSRM motoru optimal yolu otomatik çizecektir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-5">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreateRoute)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700">Güzergah Adı</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Örn: SABAH_01..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="ringTypeId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700">Ring Tipi</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ''}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Tip seçin" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="z-[9999]">
                                                        {ringTypes.map(rt => (
                                                            <SelectItem key={rt.id} value={rt.id.toString()}>{rt.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700">Harita Çizgi Rengi</FormLabel>
                                                <div className="flex gap-2 items-center">
                                                    <FormControl>
                                                        <Input type="color" {...field} className="w-12 h-10 p-1 cursor-pointer" />
                                                    </FormControl>
                                                    <Input type="text" {...field} className="font-mono text-sm uppercase" />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm relative">
                                    {/* OSRM Loading Overlay */}
                                    {calculatingRoute && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-[60] rounded-lg flex items-center justify-center">
                                            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
                                                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                                <span className="text-[10px] font-bold text-slate-600">Yol Ağları Analiz Ediliyor...</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="font-medium text-slate-700 mb-2 flex items-center justify-between">
                                        <span>Seçili Duraklar ({selectedStops.length})</span>
                                        {selectedStops.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"><RouteIcon className="w-3 h-3" /> Sıralı Çizildi</span>}
                                    </div>
                                    {selectedStops.length === 0 ? (
                                        <p className="text-slate-500 italic text-xs">Aşağıdaki haritadan durak seçiniz...</p>
                                    ) : (
                                        <div className="flex flex-col gap-1 w-full relative z-50">
                                            <SortableStopsList
                                                stops={selectedStops}
                                                onChange={setSelectedStops}
                                                onRemove={(id) => setSelectedStops(prev => prev.filter(s => s.id !== id))}
                                            />
                                            <div className="flex justify-end mt-1">
                                                <button type="button" onClick={() => setSelectedStops([])} className="text-xs text-rose-500 hover:text-rose-600 font-semibold underline">
                                                    Listeyi Temizle
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90"
                                    disabled={form.formState.isSubmitting || selectedStops.length < 2 || selectedRouteId !== null}
                                >
                                    {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Güzergahı Kaydet'}
                                </Button>
                                {selectedRouteId !== null && (
                                    <p className="text-xs text-center text-rose-500">Önizleme modundasınız. Kayıt işlemi için seçimi temizleyin.</p>
                                )}
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Hatlar Listesi */}
                <Card className="border-slate-200 shadow-sm flex-1 flex flex-col min-h-[300px] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 shrink-0">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <MapIcon className="h-5 w-5 text-primary" />
                            Kayıtlı Hatlar
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Hat ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-white"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-6 text-center text-slate-500">Yükleniyor...</div>
                        ) : filteredRoutes.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">Kayıtlı güzergah bulunamadı.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredRoutes.map(route => (
                                    <div
                                        key={route.id}
                                        className={`p-4 flex items-start justify-between hover:bg-slate-50 transition-colors cursor-pointer group ${selectedRouteId === route.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                                        onClick={() => handleRoutePreview(route)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: route.color || '#ccc' }} />
                                                <h4 className="font-semibold text-slate-800">{route.name}</h4>
                                                {selectedRouteId === route.id && <CheckCircle2 className="w-4 h-4 text-primary ml-auto mr-2 shrink-0" />}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 max-w-[250px] truncate">
                                                {route.ringType?.name} • {route.stops?.length || 0} Durak
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(route.id);
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
                    onMarkerClick={selectedRouteId === null ? handleMarkerClick : undefined}
                    selectedStopId={selectedStops.length > 0 ? selectedStops[selectedStops.length - 1].id : null}
                    highlightedStopIds={selectedStops.map(s => s.id)}
                    routeGeometry={routeGeometry}
                    routeColor={selectedRouteId !== null ? routes.find(r => r.id === selectedRouteId)?.color || '#3b82f6' : routeColorValue}
                    backgroundGeometries={routes
                        .filter(r => r.id !== selectedRouteId && r.geometry)
                        .map(r => ({ id: r.id, geometry: r.geometry as GeoJSONLineString }))}
                    masterGeometry={routes.find(r => r.geometry)?.geometry as GeoJSONLineString}
                />
            </div>

        </div>
    );
}
