"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { Room } from "@/types"; // Make sure to import the new Room interface

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Bed, Hash, DollarSign, Users, Building, MoreVertical, Edit, Trash, Wrench } from "lucide-react";

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [hotels, setHotels] = useState<Hotel[]>([]); // Required to populate the Hotel Dropdown
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Fetch both Rooms and Hotels concurrently for performance
    const fetchData = async () => {
        try {
        setIsLoading(true);
        setError(null);
        
        const [roomsResponse, hotelsResponse] = await Promise.all([
            api.get("/rooms"),
            api.get("/hotels")
        ]);
        
        // Parse Rooms Pageable format from Spring Boot
        let checkedRooms: Room[] = [];
        if (roomsResponse.data) {
            checkedRooms = Array.isArray(roomsResponse.data) ? roomsResponse.data : (roomsResponse.data.content || []);
        }
        setRooms(checkedRooms);

        // Parse Hotels Pageable format
        let checkedHotels: Hotel[] = [];
        if (hotelsResponse.data) {
            checkedHotels = Array.isArray(hotelsResponse.data) ? hotelsResponse.data : (hotelsResponse.data.content || []);
        }
        setHotels(checkedHotels);

        } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Could not load data from the server.");
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Room Creation (POST)
    const handleCreateRoom = async (formData: FormData) => {
        setIsCreating(true);
        try {
        const newRoomData = {
            roomNumber: formData.get("roomNumber"),
            capacity: Number(formData.get("capacity")),
            pricePerNight: Number(formData.get("pricePerNight")),
            roomType: formData.get("roomType"),
            hotelId: Number(formData.get("hotelId")),
        };

        await api.post("/rooms", newRoomData);
        setIsCreateModalOpen(false);
        fetchData(); // Refresh the list
        } catch (err: any) {
        console.error("Error creating room:", err);
        alert(err.response?.data?.message || "Failed to create room.");
        } finally {
        setIsCreating(false);
        }
    };

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Helper function to render status badges with distinct colors
    const renderStatusBadge = (status: string) => {
        switch (status) {
        case 'AVAILABLE': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Available</span>;
        case 'OCCUPIED': return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Occupied</span>;
        case 'MAINTENANCE': return <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">Maintenance</span>;
        case 'OUT_OF_SERVICE': return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Out of Service</span>;
        default: return <span className="px-2 py-1 text-xs font-semibold text-zinc-800 bg-zinc-100 rounded-full">{status}</span>;
        }
    };

    return (
        <div className="p-8 space-y-6">
        
        {/* HEADER & CREATE MODAL */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Rooms</h1>
            <p className="text-zinc-500">Manage inventory and availability across all hotels.</p>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New Room
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Register New Room</DialogTitle>
                <DialogDescription>Assign a room to an existing hotel.</DialogDescription>
                </DialogHeader>
                <form action={handleCreateRoom} className="space-y-4 mt-4">
                
                {/* Hotel Assignment Dropdown */}
                <div className="space-y-2">
                    <Label htmlFor="hotelId">Hotel Branch</Label>
                    <select id="hotelId" name="hotelId" required className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
                    <option value="">-- Select a Hotel --</option>
                    {hotels.map(hotel => (
                        <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                    ))}
                    </select>
                </div>

                {/* Room Identifier & Capacity */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input id="roomNumber" name="roomNumber" placeholder="e.g. 101A" required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (Guests)</Label>
                    <Input id="capacity" name="capacity" type="number" min="1" required />
                    </div>
                </div>

                {/* Room Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="roomType">Room Type</Label>
                    <select id="roomType" name="roomType" required className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
                        <option value="SINGLE">Single</option>
                        <option value="DOUBLE">Double</option>
                        <option value="MATRIMONIAL">Matrimonial</option>
                        <option value="SUITE">Suite</option>
                        <option value="PRESIDENTIAL">Presidential</option>
                    </select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="pricePerNight">Price ($)</Label>
                    <Input id="pricePerNight" name="pricePerNight" type="number" step="0.01" min="0" required />
                    </div>
                </div>

                <Button type="submit" className="w-full mt-6" disabled={isCreating}>
                    {isCreating ? "Saving..." : "Save Room"}
                </Button>
                </form>
            </DialogContent>
            </Dialog>
        </div>

        {/* ERROR & LOADING STATES */}
        {isLoading && <div className="py-12 text-center text-zinc-500 animate-pulse font-medium">Loading rooms inventory...</div>}
        {error && <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">{error}</div>}

        {/* ROOMS GRID DISPLAY */}
        {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.length === 0 ? (
                <p className="py-12 text-center border-2 border-dashed rounded-lg col-span-full text-zinc-500 font-medium bg-white">
                No rooms registered yet.
                </p>
            ) : (
                rooms.map((room) => (
                <Card key={room.id} className="overflow-hidden hover:shadow-md transition-all">
                    <CardHeader className="pb-3 border-b bg-zinc-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-zinc-400" />
                        <CardTitle className="text-xl font-bold">{room.roomNumber}</CardTitle>
                        </div>
                        {renderStatusBadge(room.roomStatus)}
                    </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Building className="w-4 h-4" />
                        <span className="font-medium truncate">{room.hotelName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Bed className="w-4 h-4" />
                        <span className="capitalize">{room.roomType.toLowerCase()}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 text-sm text-zinc-500">
                        <Users className="w-4 h-4" />
                        <span>{room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-zinc-900">
                        <DollarSign className="w-4 h-4" />
                        <span>{room.pricePerNight} <span className="text-xs text-zinc-400 font-normal">/night</span></span>
                        </div>
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