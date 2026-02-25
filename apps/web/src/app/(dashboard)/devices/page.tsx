'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getVehicles,
    PaginatedVehicles,
    Vehicle,
    deleteVehicle
} from '@/lib/devices';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import VehicleDialog from './vehicle-dialog';

export default function DevicesPage() {
    const [data, setData] = useState<PaginatedVehicles | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // Debounce arama
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // arama değiştiğinde ilk sayfaya dön
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getVehicles(page, 10, debouncedSearch);
            setData(res);
        } catch (error) {
            console.error('Araçlar yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = () => {
        setEditingVehicle(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (v: Vehicle) => {
        setEditingVehicle(v);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu aracı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteVehicle(id);
            fetchData();
        } catch (error) {
            console.error('Araç silinemedi:', error);
            alert('Silme işlemi başarısız');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Araç Yönetimi</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Sistemdeki tüm araçları ve fiziksel durumlarını yönetin.
                    </p>
                </div>
                <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Yeni Araç Ekle
                </Button>
            </div>

            {/* Arama Barı ve Filtreler */}
            <div className="flex items-center gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Plaka ile araç ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 border-slate-200 bg-white"
                    />
                </div>
            </div>

            {/* Tablo */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700">Plaka</TableHead>
                            <TableHead className="font-semibold text-slate-700">Marka / Model</TableHead>
                            <TableHead className="font-semibold text-slate-700">Atanan Şoför</TableHead>
                            <TableHead className="font-semibold text-slate-700">GPS Sensör</TableHead>
                            <TableHead className="font-semibold text-slate-700">Durum</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && !data ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    Yükleniyor...
                                </TableCell>
                            </TableRow>
                        ) : data?.vehicles?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    Araç bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.vehicles?.map((v) => (
                                <TableRow key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell className="font-bold text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-100 rounded-md text-slate-600">
                                                <Car className="h-4 w-4" />
                                            </div>
                                            {v.plate}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {v.brand ? `${v.brand} ${v.model || ''}` : <span className="text-slate-400">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {v.driver ? (
                                            <span className="text-slate-700 font-medium">{v.driver.name}</span>
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">Atanmadı</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {v.trackerId ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Bağlı
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1.5 py-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                Yok
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {v.isActive ? (
                                            <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-none font-medium">Aktif</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-slate-500 bg-slate-100">Pasif</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                                                onClick={() => handleEdit(v)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                                onClick={() => handleDelete(v.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-1">
                    <p className="text-sm text-slate-500">
                        Toplam <span className="font-medium text-slate-800">{data.total}</span> araçtan{' '}
                        <span className="font-medium text-slate-800">
                            {(page - 1) * 10 + 1}-{Math.min(page * 10, data.total)}
                        </span>{' '}
                        arası gösteriliyor
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="border-slate-200 text-slate-600 hover:text-slate-900"
                        >
                            Önceki
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= data.totalPages}
                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            className="border-slate-200 text-slate-600 hover:text-slate-900"
                        >
                            Sonraki
                        </Button>
                    </div>
                </div>
            )}

            <VehicleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                vehicle={editingVehicle}
                onSuccess={fetchData}
            />
        </div>
    );
}
