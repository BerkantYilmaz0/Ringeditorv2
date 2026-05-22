'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getVehicle, Vehicle, updateVehicle } from '@/lib/devices';
import VehicleDialog from '../vehicle-dialog';

function fmtDate(d: Date) {
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtKm(n: number) {
    return n.toLocaleString('tr-TR');
}

function getStatus(v: Vehicle): string {
    return v.currentStatus ?? (v.vehicleStatus === 'MAINTENANCE' ? 'Bakımda' : 'Boşta');
}

function StatusDropdown({ vehicle, onUpdate }: { vehicle: Vehicle; onUpdate: (v: Vehicle) => void }) {
    const [saving, setSaving] = useState(false);
    const status = getStatus(vehicle);

    const handleChange = async (newVehicleStatus: 'AVAILABLE' | 'MAINTENANCE') => {
        setSaving(true);
        try {
            const updated = await updateVehicle(vehicle.id, { vehicleStatus: newVehicleStatus });
            onUpdate({ ...vehicle, ...updated, vehicleStatus: newVehicleStatus });
            toast.success('Araç durumu güncellendi');
        } catch {
            toast.error('Durum güncellenemedi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="vd-status-wrap">
            <select
                className={`vd-status-select vd-status-select--${
                    status === 'Görevde' ? 'active' : status === 'Bakımda' ? 'maintenance' : 'idle'
                }`}
                value={vehicle.vehicleStatus}
                disabled={saving || status === 'Görevde'}
                onChange={(e) => handleChange(e.target.value as 'AVAILABLE' | 'MAINTENANCE')}
                title={status === 'Görevde' ? 'Aktif seferde, durum değiştirilemez' : undefined}
            >
                <option value="AVAILABLE">
                    {status === 'Görevde' ? '● Görevde' : '● Boşta'}
                </option>
                <option value="MAINTENANCE">🔧 Bakımda</option>
            </select>
            {saving && <span className="vd-status-saving">kaydediliyor…</span>}
        </div>
    );
}

export default function VehicleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);

    const load = async () => {
        try {
            const v = await getVehicle(id);
            setVehicle(v);
        } catch {
            router.push('/devices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    if (loading) return <div className="vd-loading">Yükleniyor...</div>;
    if (!vehicle) return null;

    const status = getStatus(vehicle);
    const todayTrips = vehicle.todayTripCount ?? 0;
    const lastServiceDate = vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate) : null;
    const nextServiceDate = vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate) : null;

    return (
        <div className="vd-page">
            {/* Breadcrumb */}
            <div className="fleet-breadcrumb" style={{ marginBottom: 20 }}>
                <button className="vd-back" onClick={() => router.push('/devices')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Araçlar
                </button>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ color: 'var(--ink-2)' }}>{vehicle.plate}</span>
            </div>

            {/* Hero Header */}
            <div className="vd-hero">
                <div className="vd-hero-left">
                    <div className="vd-hero-pills">
                        <StatusDropdown vehicle={vehicle} onUpdate={setVehicle} />
                        {!vehicle.isActive && <span className="vd-inactive-badge">Sistem Pasif</span>}
                    </div>
                    <h1 className="vd-plate">{vehicle.plate}</h1>
                    {(vehicle.brand || vehicle.model) && (
                        <p className="vd-brand">{[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ')}</p>
                    )}
                    {vehicle.driver && (
                        <div className="vd-driver-row">
                            <div className="vd-driver-avatar">{vehicle.driver.name.charAt(0)}</div>
                            <span>{vehicle.driver.name}</span>
                            <span className="vd-driver-tag">Atanmış Sürücü</span>
                        </div>
                    )}
                </div>
                <div className="vd-hero-actions">
                    <button className="vd-edit-btn" onClick={() => setEditOpen(true)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Düzenle
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="vd-kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                <div className="vd-kpi">
                    <span className="vd-kpi-val">{todayTrips}</span>
                    <span className="vd-kpi-lbl">Bugün Sefer</span>
                </div>
                <div className="vd-kpi">
                    <span className="vd-kpi-val">{vehicle.capacity ?? '—'}</span>
                    <span className="vd-kpi-lbl">Kapasite</span>
                </div>
                <div className="vd-kpi">
                    <span className="vd-kpi-val">{vehicle.odometerKm ? fmtKm(vehicle.odometerKm) : '—'}</span>
                    <span className="vd-kpi-lbl">Toplam km</span>
                </div>
                <div className="vd-kpi">
                    <span className="vd-kpi-val" style={{ fontSize: 16 }}>
                        {lastServiceDate ? fmtDate(lastServiceDate) : '—'}
                    </span>
                    <span className="vd-kpi-lbl">Son Servis</span>
                </div>
            </div>

            {/* Two-column content */}
            <div className="vd-body">
                {/* Left column */}
                <div className="vd-col">
                    {/* Araç Bilgileri */}
                    <div className="vd-card">
                        <div className="vd-card-head">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v9H4zM4 16v2h3v-2M17 16v2h3v-2M4 11h16"
                                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Araç Bilgileri
                        </div>
                        <div className="vd-info-grid">
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Plaka</span>
                                <span className="vd-info-val vd-info-mono">{vehicle.plate}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Marka</span>
                                <span className="vd-info-val">{vehicle.brand ?? '—'}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Model</span>
                                <span className="vd-info-val">{vehicle.model ?? '—'}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Model Yılı</span>
                                <span className="vd-info-val">{vehicle.year ?? '—'}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Renk</span>
                                <span className="vd-info-val">{vehicle.color ?? '—'}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Kapasite</span>
                                <span className="vd-info-val">{vehicle.capacity ? `${vehicle.capacity} kişi` : '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* GPS & Sistem */}
                    <div className="vd-card">
                        <div className="vd-card-head">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"
                                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            GPS & Sistem
                        </div>
                        <div className="vd-info-grid">
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">GPS Tracker</span>
                                <span className="vd-info-val">
                                    {vehicle.trackerId
                                        ? <span className="vd-badge vd-badge--ok"><span className="vd-badge-dot" />Bağlı · {vehicle.trackerId}</span>
                                        : <span className="vd-badge vd-badge--none">Tanımsız</span>}
                                </span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">SIM Numarası</span>
                                <span className="vd-info-val vd-info-mono">{vehicle.simNumber ?? '—'}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Sistem Durumu</span>
                                <span className="vd-info-val">
                                    {vehicle.isActive
                                        ? <span className="vd-badge vd-badge--ok"><span className="vd-badge-dot" />Aktif</span>
                                        : <span className="vd-badge vd-badge--off">Pasif</span>}
                                </span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Motor Saati</span>
                                <span className="vd-info-val">{vehicle.engineHours ? `${vehicle.engineHours} saat` : '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="vd-col">
                    {/* Servis & Bakım */}
                    <div className="vd-card">
                        <div className="vd-card-head">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Servis & Bakım
                        </div>
                        <div className="vd-info-grid">
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Son Servis</span>
                                <span className="vd-info-val">{lastServiceDate ? fmtDate(lastServiceDate) : '—'}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Sonraki Bakım</span>
                                <span className="vd-info-val">{nextServiceDate ? fmtDate(nextServiceDate) : '—'}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Toplam km</span>
                                <span className="vd-info-val vd-info-mono">
                                    {vehicle.odometerKm ? fmtKm(vehicle.odometerKm) : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notlar */}
                    {vehicle.description && (
                        <div className="vd-card">
                            <div className="vd-card-head">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"
                                        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Notlar
                            </div>
                            <p className="vd-desc">{vehicle.description}</p>
                        </div>
                    )}

                    {/* Durum bilgisi kutusu */}
                    <div className="vd-card">
                        <div className="vd-card-head">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                            </svg>
                            Operasyonel Durum
                        </div>
                        <div className="vd-info-grid">
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Güncel Durum</span>
                                <span className="vd-info-val">{status}</span>
                            </div>
                            <div className="vd-info-row">
                                <span className="vd-info-lbl">Bugün Sefer</span>
                                <span className="vd-info-val">{todayTrips} sefer</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <VehicleDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                vehicle={vehicle}
                onSuccess={load}
            />
        </div>
    );
}
