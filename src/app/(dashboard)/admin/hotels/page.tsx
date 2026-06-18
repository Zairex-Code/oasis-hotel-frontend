"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Hotel } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Importamos 'Star' para las estrellas y 'Image' como ícono de respaldo
import { Building2, Plus, MapPin, Star, Image as ImageIcon } from "lucide-react";

export default function HotelsPage() {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHotels = async () => {
        try {
            // Asegúrate de que tu endpoint en Spring Boot sea este o ajústalo si es necesario
            const response = await api.get('hotels');
            const hotelsArray = response.data.content || [];
            setHotels(response.data);
        } catch (err: any) {
            console.error("Failed to fetch hotels:", err);
            setError("Could not load hotels. Please try again later.");
        } finally {
            setIsLoading(false);
        }
        };

        fetchHotels();
    }, []);

    return (
        <div className="p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Hotels</h1>
            <p className="text-zinc-500">Manage all registered hotel branches.</p>
            </div>
            <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Hotel
            </Button>
        </div>

        {isLoading && (
            <div className="py-12 text-center text-zinc-500 animate-pulse">
            Loading hotels from database...
            </div>
        )}

        {error && (
            <div className="p-4 text-red-500 bg-red-100 rounded-md">
            {error}
            </div>
        )}

        {/* Grid de Hoteles */}
        {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.length === 0 ? (
                <p className="py-8 text-center border-2 border-dashed rounded-lg col-span-full text-zinc-500">
                    No hotels found. Click Add New Hotel to create one.
                </p>
            ) : (
                hotels.map((hotel) => (
                // Usamos overflow-hidden para que la imagen no se salga de las esquinas redondeadas de la tarjeta
                <Card key={hotel.id} className="overflow-hidden transition-shadow hover:shadow-md">
                    
                    {/* 1. SECCIÓN DE IMAGEN */}
                    <div className="relative w-full h-40 bg-zinc-100">
                    {hotel.imageUrl ? (
                        // Si el hotel tiene URL de foto, la mostramos
                        <img 
                        src={hotel.imageUrl} 
                        alt={hotel.name} 
                        className="object-cover w-full h-full"
                        />
                    ) : (
                        // Si no tiene foto, mostramos un ícono elegante de reemplazo
                        <div className="flex items-center justify-center w-full h-full text-zinc-300">
                        <ImageIcon className="w-10 h-10" />
                        </div>
                    )}
                    {/* Etiqueta de Estado Flotante sobre la imagen */}
                    <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                        hotel.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-800'
                    }`}>
                        {hotel.status}
                    </span>
                    </div>

                    <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold truncate">
                        {hotel.name}
                        </CardTitle>
                    </div>
                    
                    {/* 2. SECCIÓN DE ESTRELLAS */}
                    <div className="flex items-center mt-1 space-x-1 text-yellow-400">
                        {/* Truco: Creamos un array del tamaño del número de estrellas y lo mapeamos */}
                        {Array.from({ length: hotel.stars || 0 }).map((_, index) => (
                        <Star key={index} className="w-4 h-4 fill-current" />
                        ))}
                    </div>
                    </CardHeader>

                    <CardContent>
                    {/* 3. SECCIÓN DE UBICACIÓN (Address + City) */}
                    <div className="flex items-start gap-2 text-sm text-zinc-500">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                        {hotel.address}, <span className="font-medium text-zinc-700">{hotel.city}</span>
                        </span>
                    </div>
                    </CardContent>
                    
                </Card>
                ))
            )}
            </div>
        )}
        
        </div>
    );
}