'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getVehicles, PaginatedVehicles, Vehicle, deleteVehicle } from '@/lib/devices';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import VehicleDialog from './vehicle-dialog';

type StatusFilter = 'tumu' | 'gorevde' | 'bosta' | 'bakimda';
type ViewMode = 'grid' | 'list';

type VehicleStatus = 'Görevde' | 'Boşta' | 'Bakımda';


function getVehicleData(v: Vehicle) {
    const status: VehicleStatus = (v.currentStatus as VehicleStatus) ?? (v.vehicleStatus === 'MAINTENANCE' ? 'Bakımda' : 'Boşta');
    const todayTrips = v.todayTripCount ?? 0;
    const capacity = v.capacity;
    const totalKm = v.odometerKm;
    const lastServiceDate = v.lastServiceDate ? new Date(v.lastServiceDate) : null;
    const nextServiceDate = v.nextServiceDate ? new Date(v.nextServiceDate) : null;
    return { status, todayTrips, capacity, totalKm, lastServiceDate, nextServiceDate };
}

function fmtDate(d: Date) {
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtKm(km: number) {
    return km.toLocaleString('tr-TR');
}

function StatusPill({ status }: { status: VehicleStatus }) {
    if (status === 'Görevde') {
        return (
            <span className="fleet-pill fleet-pill--active">
                <span className="fleet-pill-dot" />
                Görevde
            </span>
        );
    }
    if (status === 'Boşta') {
        return <span className="fleet-pill fleet-pill--idle">Boşta</span>;
    }
    return <span className="fleet-pill fleet-pill--maintenance">Bakımda</span>;
}

const EDIT_ICON = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const DEL_ICON = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

function VehicleGridCard({ v, onEdit, onDelete, onClick }: {
    v: Vehicle; onEdit: () => void; onDelete: () => void; onClick: () => void;
}) {
    const d = getVehicleData(v);
    return (
        <div className="fleet-card" onClick={onClick} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}>
            <div className="fleet-card-head">
                <StatusPill status={d.status} />
            </div>
            <div className="fleet-plate">{v.plate}</div>
            <div className="fleet-driver">
                {v.driver?.name ?? <span className="fleet-driver--none">Sürücü atanmamış</span>}
            </div>
            <div className="fleet-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                <div className="fleet-stat">
                    <span className="fleet-stat-val">{d.todayTrips}</span>
                    <span className="fleet-stat-lbl">Bugün sefer</span>
                </div>
                <div className="fleet-stat">
                    <span className="fleet-stat-val">{d.capacity ?? '—'}</span>
                    <span className="fleet-stat-lbl">Kapasite</span>
                </div>
                <div className="fleet-stat">
                    <span className="fleet-stat-val">{d.totalKm ? fmtKm(d.totalKm) : '—'}</span>
                    <span className="fleet-stat-lbl">Toplam km</span>
                </div>
            </div>
            <div className="fleet-service">
                <div>
                    <span className="fleet-svc-lbl">Son servis</span>
                    <span className="fleet-svc-val">{d.lastServiceDate ? fmtDate(d.lastServiceDate) : '—'}</span>
                </div>
                <div>
                    <span className="fleet-svc-lbl">Sonraki bakım</span>
                    <span className="fleet-svc-val">{d.nextServiceDate ? fmtDate(d.nextServiceDate) : '—'}</span>
                </div>
                <div>
                    <span className="fleet-svc-lbl">Marka / Model</span>
                    <span className="fleet-svc-val">{[v.brand, v.model].filter(Boolean).join(' ') || '—'}</span>
                </div>
            </div>
            <div className="fleet-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="fleet-action-btn" onClick={onEdit} title="Düzenle">{EDIT_ICON}</button>
                <button className="fleet-action-btn fleet-action-btn--danger" onClick={onDelete} title="Sil">{DEL_ICON}</button>
            </div>
        </div>
    );
}

function VehicleListRow({ v, onEdit, onDelete, onClick }: {
    v: Vehicle; onEdit: () => void; onDelete: () => void; onClick: () => void;
}) {
    const d = getVehicleData(v);
    return (
        <div className="fleet-row" onClick={onClick} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}>
            <div><StatusPill status={d.status} /></div>
            <div className="fleet-row-plate">{v.plate}</div>
            <div className="fleet-row-driver">{v.driver?.name ?? <span className="fleet-driver--none">—</span>}</div>
            <div className="fleet-row-stat">{v.brand ? `${v.brand} ${v.model ?? ''}`.trim() : '—'}</div>
            <div className="fleet-row-stat">{d.todayTrips} sefer</div>
            <div className="fleet-row-stat">{d.capacity ? `${d.capacity} kişi` : '—'}</div>
            <div className="fleet-row-km">{d.totalKm ? `${fmtKm(d.totalKm)} km` : '—'}</div>
            <div className="fleet-row-stat">{d.lastServiceDate ? fmtDate(d.lastServiceDate) : '—'}</div>
            <div className="fleet-row-stat">{d.nextServiceDate ? fmtDate(d.nextServiceDate) : '—'}</div>
            <div className="fleet-row-actions" onClick={(e) => e.stopPropagation()}>
                <button className="fleet-action-btn" onClick={onEdit} title="Düzenle">{EDIT_ICON}</button>
                <button className="fleet-action-btn fleet-action-btn--danger" onClick={onDelete} title="Sil">{DEL_ICON}</button>
            </div>
        </div>
    );
}

const STATUS_MAP: Record<StatusFilter, VehicleStatus | null> = {
    tumu: null,
    gorevde: 'Görevde',
    bosta: 'Boşta',
    bakimda: 'Bakımda',
};

const FILTER_LABELS: { key: StatusFilter; label: string }[] = [
    { key: 'tumu', label: 'Tümü' },
    { key: 'gorevde', label: 'Görevde' },
    { key: 'bosta', label: 'Boşta' },
    { key: 'bakimda', label: 'Bakımda' },
];

export default function DevicesPage() {
    const router = useRouter();
    const [data, setData] = useState<PaginatedVehicles | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('tumu');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getVehicles(1, 100);
            setData(res);
        } catch {
            toast.error('Araçlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = () => { setEditingVehicle(null); setIsDialogOpen(true); };
    const handleEdit = (v: Vehicle) => { setEditingVehicle(v); setIsDialogOpen(true); };
    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteVehicle(deleteConfirmId);
            toast.success('Araç silindi');
            fetchData();
        } catch (error) {
            toast.error((error as Error).message || 'Silme işlemi başarısız');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const vehicles = data?.vehicles ?? [];

    const filtered = statusFilter === 'tumu'
        ? vehicles
        : vehicles.filter(v => getVehicleData(v).status === STATUS_MAP[statusFilter]);

    const counts = {
        tumu: vehicles.length,
        gorevde: vehicles.filter(v => getVehicleData(v).status === 'Görevde').length,
        bosta: vehicles.filter(v => getVehicleData(v).status === 'Boşta').length,
        bakimda: vehicles.filter(v => getVehicleData(v).status === 'Bakımda').length,
    };

    return (
        <div className="fleet-page">
            {/* Breadcrumb */}
            <div className="fleet-breadcrumb">
                <span>Araç Yönetimi</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Araçlar</span>
            </div>

            {/* Page Header */}
            <div className="fleet-header">
                <div>
                    <h1 className="fleet-title">Filo</h1>
                    <p className="fleet-subtitle">
                        {vehicles.length} araç · {counts.gorevde} görevde, {counts.bakimda} bakımda.{' '}
                        Plaka, durum ve sürücüye göre filtrele.
                    </p>
                </div>
                <div className="fleet-header-actions">
                    {/* Filter chips */}
                    <div className="fleet-filters">
                        {FILTER_LABELS.map(f => (
                            <button
                                key={f.key}
                                className={`fleet-filter-chip ${statusFilter === f.key ? 'is-active' : ''}`}
                                onClick={() => setStatusFilter(f.key)}
                            >
                                {f.label}
                                <span className="fleet-filter-count">{counts[f.key]}</span>
                            </button>
                        ))}
                    </div>

                    {/* View toggle */}
                    <div className="fleet-view-toggle">
                        <button
                            className={`fleet-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid görünüm"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                            </svg>
                        </button>
                        <button
                            className={`fleet-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="Liste görünüm"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <button className="fleet-add-btn" onClick={handleAdd}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Araç ekle
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="fleet-loading">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
                <div className="fleet-empty">Bu filtrede araç bulunamadı.</div>
            ) : viewMode === 'grid' ? (
                <div className="fleet-grid">
                    {filtered.map(v => (
                        <VehicleGridCard
                            key={v.id}
                            v={v}
                            onEdit={() => handleEdit(v)}
                            onDelete={() => setDeleteConfirmId(v.id)}
                            onClick={() => router.push(`/devices/${v.id}`)}
                        />
                    ))}
                </div>
            ) : (
                <div className="fleet-list">
                    <div className="fleet-list-header">
                        <span>Durum</span>
                        <span>Plaka</span>
                        <span>Sürücü</span>
                        <span>Marka / Model</span>
                        <span>Bugün</span>
                        <span>Kapasite</span>
                        <span>Toplam km</span>
                        <span>Son servis</span>
                        <span>Sonraki bakım</span>
                        <span></span>
                    </div>
                    {filtered.map(v => (
                        <VehicleListRow
                            key={v.id}
                            v={v}
                            onEdit={() => handleEdit(v)}
                            onDelete={() => setDeleteConfirmId(v.id)}
                            onClick={() => router.push(`/devices/${v.id}`)}
                        />
                    ))}
                </div>
            )}

            <VehicleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                vehicle={editingVehicle}
                onSuccess={fetchData}
            />

            <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aracı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu aracı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDelete}>
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
