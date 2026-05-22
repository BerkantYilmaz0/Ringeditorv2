'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface DashboardRoute {
    id: number;
    name: string;
    color?: string | null;
    geometry?: { type: 'LineString'; coordinates: [number, number][] } | null;
    ringType?: { name: string; color?: string | null } | null;
    stops?: { sequence: number; stop: { id: number; name: string; lat: number; lng: number } }[];
}

interface Props {
    routes: DashboardRoute[];
}

export default function DashboardMap({ routes }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    if (!mounted) {
        return (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                Harita yükleniyor…
            </div>
        );
    }

    // Merkez hesapla
    const allStops = routes.flatMap(r => r.stops ?? []).map(rs => rs.stop).filter(s => s.lat && s.lng);
    const center: [number, number] = allStops.length > 0
        ? [
            allStops.reduce((s, p) => s + p.lat, 0) / allStops.length,
            allStops.reduce((s, p) => s + p.lng, 0) / allStops.length,
          ]
        : [39.9208, 32.8541]; // Ankara fallback

    // Benzersiz duraklar (popup için)
    const uniqueStops = new Map<number, typeof allStops[0]>();
    allStops.forEach(s => uniqueStops.set(s.id, s));

    return (
        <MapContainer
            center={center}
            zoom={12}
            style={{ width: '100%', height: '100%', zIndex: 0 }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap"
            />

            {/* Güzergahlar */}
            {routes.map(route => {
                const color = route.color || route.ringType?.color || '#0d9488';
                const stops = (route.stops ?? [])
                    .sort((a, b) => a.sequence - b.sequence)
                    .map(rs => rs.stop)
                    .filter(s => s.lat && s.lng);

                if (route.geometry?.type === 'LineString' && route.geometry.coordinates.length > 1) {
                    // OSRM geometrisi varsa kullan
                    const feature = { type: 'Feature' as const, geometry: route.geometry, properties: {} };
                    return (
                        <GeoJSON
                            key={`geo-${route.id}`}
                            data={feature}
                            style={{ color, weight: 5, opacity: 0.85 }}
                        />
                    );
                }

                // Yoksa durakları birleştir
                if (stops.length < 2) return null;
                const positions = stops.map(s => [s.lat, s.lng] as [number, number]);
                return (
                    <Polyline
                        key={`poly-${route.id}`}
                        positions={positions}
                        pathOptions={{ color, weight: 4, opacity: 0.8 }}
                    />
                );
            })}

            {/* Durak noktaları */}
            {Array.from(uniqueStops.values()).map(stop => (
                <CircleMarker
                    key={stop.id}
                    center={[stop.lat, stop.lng]}
                    radius={6}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: '#475569', fillOpacity: 1 }}
                >
                    <Tooltip permanent={false} direction="top" offset={[0, -8]}>
                        <span style={{ fontFamily: '"Manrope", sans-serif', fontSize: 12, fontWeight: 600 }}>{stop.name}</span>
                    </Tooltip>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}
