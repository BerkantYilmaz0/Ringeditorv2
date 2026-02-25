'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, GeoJSON } from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map-animations.css'; // Yeni eklenecek animasyon dosyası
import { Stop } from '@/lib/stops';
import { GeoJSONLineString } from '@/lib/routes';

// Durak ikonunu oluşturan fonksiyon (SVG divIcon)
const createStopIcon = (color: string = '#3b82f6', isSelected: boolean = false, isRouteMember: boolean = false) => {
    // Renk hiyerarşisi: Seçili Durak (Mavi) > Rotaya Dahil Durak (Rota Rengi) > Standart Durak (Koyu Gri/Slate)
    const finalColor = isSelected ? '#3b82f6' : (isRouteMember ? color : '#475569');
    const scale = isSelected ? 'scale(1.25)' : 'scale(1)';
    const opacity = '1'; // Solgunluğu tamamen kaldırıyoruz, her zaman net görünsün.

    return L.divIcon({
        html: `
            <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; transform: ${scale}; transition: all 0.2s ease-out; opacity: ${opacity};">
                <div style="position: absolute; width: 28px; height: 28px; background: white; border-radius: 50%; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 2.5px solid ${finalColor};"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${finalColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: relative; z-index: 10;">
                    <rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 21v-2"/>
                </svg>
            </div>
        `,
        className: 'custom-stop-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

interface MapComponentProps {
    stops: Stop[];
    center?: [number, number];
    zoom?: number;
    onMapClick?: (lat: number, lng: number) => void;
    onMarkerClick?: (stopId: number) => void;
    selectedStopId?: number | null;
    highlightedStopIds?: number[]; // Aktif rotadaki durakların ID'leri
    routeGeometry?: GeoJSONLineString | null; // OSRM'den gelen GeoJSON (Yeni çizim için)
    routeColor?: string;              // Güzergah çizgi rengi
    backgroundGeometries?: { id: number; geometry: GeoJSONLineString; color?: string | null }[]; // Diğer hatlar
    masterGeometry?: GeoJSONLineString | null; // ODTÜ Modeli: Sabit Ana Şebeke
}

// Haritaya tıklanma eventini yakalayan iç bileşen
function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onClick) {
                onClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

// Seçili durak değiştiğinde haritayı oraya uçuran component
function MapController({ selectedStop }: { selectedStop?: Stop | null }) {
    const map = useMap();
    useEffect(() => {
        if (selectedStop) {
            map.flyTo([selectedStop.lat, selectedStop.lng], 16, { animate: true });
        }
    }, [selectedStop, map]);
    return null;
}

export default function MapComponent({
    stops,
    center = [39.92077, 32.85411],
    zoom = 12,
    onMapClick,
    onMarkerClick,
    selectedStopId,
    highlightedStopIds = [],
    routeGeometry,
    routeColor = '#3b82f6',
    backgroundGeometries = [],
    masterGeometry = null
}: MapComponentProps) {
    // SSR'de render etmemek için bir mount check yapsak da 'next/dynamic' de bunu handle eder, yine de önlem.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    if (!mounted) {
        return <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Harita yükleniyor...</div>;
    }

    const selectedStopInfo = selectedStopId ? stops.find(s => s.id === selectedStopId) : null;

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className="w-full h-full z-0 rounded-xl overflow-hidden shadow-inner"
            style={{ minHeight: '400px' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ClickHandler onClick={onMapClick} />
            <MapController selectedStop={selectedStopInfo} />

            {/* KATMAN 1: Ana Şebeke (Master Route) - Her zaman altta ve sabit gri */}
            {masterGeometry && (
                <GeoJSON
                    key="master-route"
                    data={masterGeometry}
                    style={{ color: '#94a3b8', weight: 4, opacity: 0.4 }}
                />
            )}

            {/* KATMAN 2: Arka Plan Şebeke (Diğer Hatlar) - İnce kesikli çizgiler */}
            {backgroundGeometries.map(bg => (
                <GeoJSON
                    key={`bg-${bg.id}`}
                    data={bg.geometry}
                    style={{ color: '#cbd5e1', weight: 3, opacity: 0.3, dashArray: '5, 8' }}
                />
            ))}

            {/* KATMAN 3: Aktif Rota / Hat (Vurgulanan) - OSRM AI Animasyonlu Rota */}
            {routeGeometry && (
                <GeoJSON
                    key={JSON.stringify(routeGeometry)} /* geometry değiştiğinde re-render için key */
                    data={routeGeometry}
                    style={{
                        color: routeColor,
                        weight: 6,
                        opacity: 0.9,
                        dashArray: '10, 20', // Kesik çizgi aralıkları
                        className: 'animated-route-line' // map-animations.css içindeki keyframe animasyonu buraya etki edecek
                    }}
                />
            )}

            {stops.map(stop => {
                const isSelected = stop.id === selectedStopId;
                // Bu durağın aktif rota içerisinde olup olmadığını kontrol et
                const isRouteMember = highlightedStopIds.includes(stop.id);

                return (
                    <Marker
                        key={stop.id}
                        position={[stop.lat, stop.lng]}
                        icon={createStopIcon(routeColor, isSelected, isRouteMember)}
                        eventHandlers={{
                            click: (e) => {
                                if (onMarkerClick) onMarkerClick(stop.id);
                                e.target.openPopup();
                            }
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1 min-w-[160px]">
                                <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5 mb-2">{stop.name}</div>
                                {stop.description && (
                                    <div className="text-[11px] text-slate-500 italic mb-2">{stop.description}</div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Duraktan Geçen Hatlar</div>
                                    {stop.routes && stop.routes.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {stop.routes.map((sr, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-1"
                                                    style={{ backgroundColor: sr.route.color || '#64748b' }}
                                                >
                                                    <div className="w-1 h-1 rounded-full bg-white opacity-60"></div>
                                                    {sr.route.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-400 italic font-medium">Burası &quot;Yalnız&quot; bir durak... Hat yok.</div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
