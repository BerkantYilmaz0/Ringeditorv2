'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRingTypes, deleteRingType, RingType } from '@/lib/ring-types';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Route,
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
import RingTypeDialog from './ring-type-dialog';

export default function RingTypesPage() {
    const [data, setData] = useState<RingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRingType, setEditingRingType] = useState<RingType | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getRingTypes();
            setData(res);
        } catch (error) {
            console.error('Ring tipleri yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = () => {
        setEditingRingType(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rt: RingType) => {
        setEditingRingType(rt);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bu ring tipini silmek istediğinize emin misiniz? (İlgili güzergahlar varsa silinemeyebilir)')) return;
        try {
            await deleteRingType(id);
            fetchData();
        } catch (error: unknown) {
            console.error('Ring tipi silinemedi:', error);
            alert((error as Error).message || 'Silme işlemi başarısız');
        }
    };

    // Client-side search (veritabanında çok veri olmayacağından mantıklı)
    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Ring Tipi Yönetimi</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Sistemdeki ring tiplerini (Hat/Kategori) ve çalışma kodlarını belirleyin.
                    </p>
                </div>
                <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Yeni Ring Tipi
                </Button>
            </div>

            {/* Arama Barı */}
            <div className="flex items-center gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Ring adında ara..."
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
                            <TableHead className="font-semibold text-slate-700 w-16">Renk</TableHead>
                            <TableHead className="font-semibold text-slate-700">Ring Adı</TableHead>
                            <TableHead className="font-semibold text-slate-700">Tip Kodu (ID)</TableHead>
                            <TableHead className="font-semibold text-slate-700">Açıklama</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    Yükleniyor...
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    Kayıtlı ring tipi bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((rt) => (
                                <TableRow key={rt.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell>
                                        <div
                                            className="w-8 h-8 rounded-full border border-slate-200/50 shadow-sm"
                                            style={{ backgroundColor: rt.color || '#e2e8f0' }}
                                            title={rt.color}
                                        />
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-100 rounded-md text-slate-600">
                                                <Route className="h-4 w-4" />
                                            </div>
                                            {rt.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 font-mono text-sm">
                                        {rt.typeId}
                                    </TableCell>
                                    <TableCell className="text-slate-600 truncate max-w-[200px]">
                                        {rt.description || <span className="text-slate-400 italic">Açıklama yok</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                                                onClick={() => handleEdit(rt)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                                onClick={() => handleDelete(rt.id)}
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

            <RingTypeDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                ringType={editingRingType}
                onSuccess={fetchData}
            />
        </div>
    );
}
