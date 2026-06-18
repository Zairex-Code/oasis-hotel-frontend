"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Hotel } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// 1. Importamos las piezas del Modal (Dialog) de shadcn
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Star, Image as ImageIcon } from "lucide-react";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Estados para controlar el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Extraemos la función fetchHotels para poder reutilizarla
  const fetchHotels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/hotels"); 

      let checkedHotels: Hotel[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          checkedHotels = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          checkedHotels = response.data.content;
        }
      }
      setHotels(checkedHotels);
    } catch (err: any) {
      console.error("Error fetching hotels:", err);
      setError("Could not load hotels from Spring Boot.");
    } finally {
      setIsLoading(false);
    }
  };

  // Se ejecuta al cargar la pantalla por primera vez
  useEffect(() => {
    fetchHotels();
  }, []);

  // 3. Acción de React 19 para enviar el formulario a Java
  const handleCreateHotel = async (formData: FormData) => {
    setIsCreating(true);
    try {
      // Extraemos los datos del formulario (Asegúrate de que calcen con tu HotelRequestDTO en Java)
      const newHotelData = {
        name: formData.get("name"),
        address: formData.get("address"),
        city: formData.get("city"),
        stars: Number(formData.get("stars")), // Convertimos a número
        imageUrl: formData.get("imageUrl") || null,
      };

      // Enviamos el POST a Java
      await api.post("/v1/api/hotels", newHotelData);
      
      // Si fue exitoso: Cerramos el modal y recargamos la lista
      setIsCreateModalOpen(false);
      fetchHotels(); 
      
    } catch (err: any) {
      console.error("Error creating hotel:", err);
      alert(err.response?.data?.message || "Error al crear el hotel");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header & Dialog Trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Hotels</h1>
          <p className="text-zinc-500">Manage all registered hotel branches.</p>
        </div>
        
        {/* 4. Envolvemos el botón en un Dialog */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New Hotel
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Hotel</DialogTitle>
              <DialogDescription>
                Fill in the details to register a new branch in the system.
              </DialogDescription>
            </DialogHeader>
            
            <form action={handleCreateHotel} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name</Label>
                <Input id="name" name="name" placeholder="Oasis Lima Central" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Lima" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Input id="address" name="address" placeholder="Av. Principal 123" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stars">Stars (1-5)</Label>
                <Input id="stars" name="stars" type="number" min="1" max="5" placeholder="5" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
              </div>
              
              <Button type="submit" className="w-full mt-6" disabled={isCreating}>
                {isCreating ? "Saving to database..." : "Save Hotel"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      </div>

      {/* States (Cargando o Error) */}
      {isLoading && (
        <div className="py-12 text-center text-zinc-500 animate-pulse font-medium">
          Loading hotels from database...
        </div>
      )}

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Grid rendering (Igual que antes, completamente protegido) */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(hotels) && hotels.length === 0 ? (
            <p className="py-12 text-center border-2 border-dashed rounded-lg col-span-full text-zinc-500 font-medium bg-white">
              No hotels found. Click "Add New Hotel" to create one.
            </p>
          ) : (
            Array.isArray(hotels) && hotels.map((hotel) => (
              <Card key={hotel.id || Math.random()} className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative w-full h-40 bg-zinc-100">
                  {hotel.imageUrl ? (
                    <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-zinc-300">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                      hotel.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-800'
                  }`}>
                    {hotel.status || 'UNKNOWN'}
                  </span>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold truncate">
                    {hotel.name || 'Unnamed Hotel'}
                  </CardTitle>
                  <div className="flex items-center mt-1 space-x-1 text-yellow-400">
                    {Array.from({ length: Number(hotel.stars) || 0 }).map((_, index) => (
                      <Star key={index} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 text-sm text-zinc-500">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">
                      {hotel.address || 'No address provided'}, <span className="font-medium text-zinc-700">{hotel.city || ''}</span>
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