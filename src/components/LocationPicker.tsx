import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Crosshair } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number | null;
    initialLng?: number | null;
    disableClick?: boolean;
}

function LocationMarker({ onLocationSelect, position, setPosition, disableClick }: any) {
    const map = useMapEvents({
        click(e) {
            if (disableClick) return;
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position ? <Marker position={position} /> : null;
}

// Component to handle "Locate Me"
function LocateControl({ setPosition, onLocationSelect }: any) {
    const map = useMap();

    const handleLocate = () => {
        map.locate({ enableHighAccuracy: true })
            .on("locationfound", function (e: any) {
                setPosition(e.latlng);
                onLocationSelect(e.latlng.lat, e.latlng.lng);
                map.flyTo(e.latlng, map.getZoom());
            })
            .on("locationerror", function (e: any) {
                alert("Could not access your location. Please enable GPS permissions.");
            });
    };

    return (
        <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control leaflet-bar">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent map click
                        handleLocate();
                    }}
                    className="bg-white p-2 hover:bg-gray-100 flex items-center justify-center w-10 h-10 shadow-md border border-gray-300 rounded"
                    title="Locate Me"
                >
                    <Crosshair className="w-5 h-5 text-gray-700" />
                </button>
            </div>
        </div>
    );
}

// New component to trigger geolocation automatically
function LocateOnMount({ setPosition, onLocationSelect, active }: any) {
    const map = useMap();

    useEffect(() => {
        if (active) {
            map.locate({ enableHighAccuracy: true })
                .on("locationfound", function (e: any) {
                    setPosition(e.latlng);
                    onLocationSelect(e.latlng.lat, e.latlng.lng);
                    map.flyTo(e.latlng, map.getZoom());
                })
                .on("locationerror", function (e: any) {
                    console.log("Location access denied or failed:", e.message);
                    // Optional: alert asking user to enable GPS if silent failure occurs
                });
        }
    }, [map, active, setPosition, onLocationSelect]);

    return null;
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng, disableClick = false }: LocationPickerProps) {
    // Default to Algiers if no location provided
    const defaultPosition: [number, number] = [36.75, 3.05];
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );

    // Determines if we should auto-locate: ONLY if no initial position is provided and not disabled
    const shouldAutoLocate = !disableClick && !initialLat && !initialLng;

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    return (
        <div className="h-full w-full relative z-0">
            {/* z-0 ensures map stays below modals/overlays if improperly stacked */}
            <MapContainer
                center={position ? [position.lat, position.lng] : defaultPosition}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={!disableClick} // Disable scroll zoom if map is meant to be static preview
                dragging={!disableClick}
                zoomControl={!disableClick} // Hide zoom controls on static preview
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    onLocationSelect={onLocationSelect}
                    position={position}
                    setPosition={setPosition}
                    disableClick={disableClick}
                />

                {!disableClick && (
                    <>
                        <LocateControl setPosition={setPosition} onLocationSelect={onLocationSelect} />
                        <LocateOnMount
                            setPosition={setPosition}
                            onLocationSelect={onLocationSelect}
                            active={shouldAutoLocate}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}
