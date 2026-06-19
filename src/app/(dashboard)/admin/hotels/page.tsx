"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
// 1. IMPORT OUR AUTH CONTEXT
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Star, Image as ImageIcon, MoreVertical, Edit, Power } from "lucide-react";

export default function HotelsPage() {
    // 2. EXTRACT THE LOGGED IN USER
    const { user } = useAuth();
    
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [hotelToEdit, setHotelToEdit] = useState<Hotel | null>(null); 

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

    useEffect(() => {
        fetchHotels();
    }, []);

    const handleCreateHotel = async (formData: FormData) => {
        setIsCreating(true);
        try {
        const newHotelData = {
            name: formData.get("name"),
            address: formData.get("address"),
            city: formData.get("city"),
            stars: Number(formData.get("stars")),
            imageUrl: formData.get("imageUrl") || null,
        };

        await api.post("/hotels", newHotelData);
        setIsCreateModalOpen(false);
        fetchHotels(); 
        } catch (err: any) {
        console.error("Error creating hotel:", err);
        alert(err.response?.data?.message || "Error al crear el hotel");
        } finally {
        setIsCreating(false);
        }
    };

    const handleUpdateHotel = async (formData: FormData) => {
        if (!hotelToEdit) return; 
        
        setIsUpdating(true);
        try {
        const updatedData = {
            name: formData.get("name"),
            address: formData.get("address"),
            city: formData.get("city"),
            stars: Number(formData.get("stars")),
            imageUrl: formData.get("imageUrl") || null,
        };

        await api.put(`/hotels/${hotelToEdit.id}`, updatedData);
        
        setIsEditModalOpen(false);
        setHotelToEdit(null); 
        fetchHotels(); 
        } catch (err: any) {
        console.error("Error updating hotel:", err);
        alert(err.response?.data?.message || "Error al actualizar el hotel");
        } finally {
        setIsUpdating(false);
        }
    };

    const handleToggleStatus = async (hotelId: number, currentStatus: string) => {
        try {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await api.put(`/hotels/${hotelId}/status`, { status: newStatus });
        fetchHotels();
        } catch (err: any) {
        console.error("Error al cambiar estado:", err);
        alert("No se pudo actualizar el estado del hotel. Verifica el endpoint en Java.");
        }
    };

    const openEditModal = (hotel: Hotel) => {
        setHotelToEdit(hotel); 
        setIsEditModalOpen(true); 
    };

    return (
        <div className="p-8 space-y-6">
        
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Hotels</h1>
            <p className="text-zinc-500">Manage all registered hotel branches.</p>
            </div>
            
            {/* 3. STRICT COMPONENT HIDING: Only ADMIN users can see and trigger the Create Modal */}
            {user?.role === 'ADMIN' && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add New Hotel
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Hotel</DialogTitle>
                    <DialogDescription>Fill in the details to register a new branch.</DialogDescription>
                </DialogHeader>
                <form action={handleCreateHotel} className="space-y-4 mt-4">
                    <div className="space-y-2"><Label htmlFor="name">Hotel Name</Label><Input id="name" name="name" required /></div>
                    <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" name="city" required /></div>
                    <div className="space-y-2"><Label htmlFor="address">Full Address</Label><Input id="address" name="address" required /></div>
                    <div className="space-y-2"><Label htmlFor="stars">Stars (1-5)</Label><Input id="stars" name="stars" type="number" min="1" max="5" required /></div>
                    <div className="space-y-2"><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" name="imageUrl" type="url" /></div>
                    <Button type="submit" className="w-full mt-6" disabled={isCreating}>{isCreating ? "Saving..." : "Save Hotel"}</Button>
                </form>
                </DialogContent>
            </Dialog>
            )}
        </div>

        {/* EDIT MODAL REMAINS THE SAME */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Hotel</DialogTitle>
                <DialogDescription>Update the details of the selected branch.</DialogDescription>
            </DialogHeader>
            {hotelToEdit && (
                <form action={handleUpdateHotel} className="space-y-4 mt-4">
                <div className="space-y-2"><Label htmlFor="edit-name">Hotel Name</Label><Input id="edit-name" name="name" defaultValue={hotelToEdit.name} required /></div>
                <div className="space-y-2"><Label htmlFor="edit-city">City</Label><Input id="edit-city" name="city" defaultValue={hotelToEdit.city} required /></div>
                <div className="space-y-2"><Label htmlFor="edit-address">Full Address</Label><Input id="edit-address" name="address" defaultValue={hotelToEdit.address} required /></div>
                <div className="space-y-2"><Label htmlFor="edit-stars">Stars (1-5)</Label><Input id="edit-stars" name="stars" type="number" min="1" max="5" defaultValue={hotelToEdit.stars} required /></div>
                <div className="space-y-2"><Label htmlFor="edit-imageUrl">Image URL</Label><Input id="edit-imageUrl" name="imageUrl" type="url" defaultValue={hotelToEdit.imageUrl || ''} /></div>
                <Button type="submit" className="w-full mt-6" disabled={isUpdating}>{isUpdating ? "Updating database..." : "Save Changes"}</Button>
                </form>
            )}
            </DialogContent>
        </Dialog>

        {isLoading && <div className="py-12 text-center text-zinc-500 animate-pulse font-medium">Loading hotels from database...</div>}
        {error && <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">{error}</div>}

        {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(hotels) && hotels.length === 0 ? (
                <p className="py-12 text-center border-2 border-dashed rounded-lg col-span-full text-zinc-500 font-medium bg-white">
                No hotels found in the system.
                </p>
            ) : (
                Array.isArray(hotels) && hotels.map((hotel) => (
                <Card key={hotel.id || Math.random()} className="overflow-hidden transition-shadow hover:shadow-md">
                    <div className="relative w-full h-40 bg-zinc-100">
                    {hotel.imageUrl ? (
                        <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full" />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-zinc-300"><ImageIcon className="w-10 h-10" /></div>
                    )}
                    <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                        hotel.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {hotel.status || 'UNKNOWN'}
                    </span>
                    </div>
                    
                    <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                        <CardTitle className="text-xl font-bold truncate pr-4">
                            {hotel.name || 'Unnamed Hotel'}
                        </CardTitle>
                        <div className="flex items-center mt-1 space-x-1 text-yellow-400">
                            {Array.from({ length: Number(hotel.stars) || 0 }).map((_, index) => (
                            <Star key={index} className="w-4 h-4 fill-current" />
                            ))}
                        </div>
                        </div>
                        
                        {/* 4. STRICT COMPONENT HIDING: Only ADMINs see the 3-dots Kebab Menu to Edit/Deactivate */}
                        {user?.role === 'ADMIN' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4 text-zinc-500" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => openEditModal(hotel)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Hotel
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                onClick={() => handleToggleStatus(hotel.id, hotel.status)} 
                                className={hotel.status === 'ACTIVE' ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
                            >
                                <Power className="mr-2 h-4 w-4" /> 
                                {hotel.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}

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