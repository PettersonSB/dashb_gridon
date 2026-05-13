import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon not showing correctly in React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface LocationMapProps {
    lat?: number;
    lng?: number;
    editable?: boolean;
    onChange?: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function MapEvents({ onChange, editable }: { onChange?: (lat: number, lng: number) => void, editable: boolean }) {
    useMapEvents({
        click(e) {
            if (editable && onChange) {
                onChange(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

// Component to recenter map when lat/lng props change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        // Zoom para nível de rua (16) quando coordenadas mudam
        const targetZoom = map.getZoom() < 10 ? 16 : map.getZoom();
        map.flyTo([lat, lng], targetZoom, { duration: 1.2 });
    }, [lat, lng, map]);
    return null;
}

export function LocationMap({ lat, lng, editable = false, onChange }: LocationMapProps) {
    // Default to Brazil's center if no lat/lng is provided
    const defaultLat = -14.2350;
    const defaultLng = -51.9253;
    const defaultZoom = lat && lng ? 15 : 4;
    
    const centerLat = lat || defaultLat;
    const centerLng = lng || defaultLng;

    return (
        <div className="w-full h-64 rounded-xl overflow-hidden border border-white/[0.08] relative z-0">
            <MapContainer 
                center={[centerLat, centerLng]} 
                zoom={defaultZoom} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={editable}
                dragging={editable}
                doubleClickZoom={editable}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {(lat !== undefined && lng !== undefined) && (
                    <Marker position={[lat, lng]} />
                )}
                {lat && lng && <RecenterMap lat={lat} lng={lng} />}
                <MapEvents editable={editable} onChange={onChange} />
            </MapContainer>
            
            {!editable && (
                <div className="absolute inset-0 bg-transparent z-[1000]" /> // Overlay to prevent interaction in view mode just in case
            )}
        </div>
    );
}
