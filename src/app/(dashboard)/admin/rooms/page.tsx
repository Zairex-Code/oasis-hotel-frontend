"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Room, Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bed, Plus, ArrowLeft, Building2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RoomsPage() {
  const { user: currentUser } = useAuth();
  
  // 🚀 1. ROUTING STATE (Master-Detail Pattern)
  const [viewMode, setViewMode] = useState<'HOTELS' | 'ROOMS'>('HOTELS');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  // Data states
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form & Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomType, setRoomType] = useState("SINGLE");

  // Pagination for Rooms
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // 🚀 2. FETCH HOTELS (Master View)
  const fetchHotels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch a large batch of branches to display the selection grid
      const res = await api.get("/hotels?size=100"); 
      setHotels(res.data.content || []);
    } catch (err) {
      setError("Failed to load the hotel directory.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 3. FETCH ROOMS BY CONTEXT HOTEL (Detail View)
  const fetchRoomsByHotel = async (hotelId: number, page: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      // Calls the highly optimized JPA query in Spring Boot
      const res = await api.get(`/rooms/hotelId/${hotelId}?page=${page}`);
      
      setRooms(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || res.data.content?.length || 0);
    } catch (err) {
      setError("Failed to synchronize room inventory for this branch.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 4. VIEW LIFECYCLE CONTROLLER
  useEffect(() => {
    if (viewMode === 'HOTELS') {
      fetchHotels();
    } else if (viewMode === 'ROOMS' && selectedHotel) {
      fetchRoomsByHotel(selectedHotel.id, currentPage);
    }
  }, [viewMode, currentPage, selectedHotel]);

  // NAVIGATION HANDLERS
  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setCurrentPage(0); // Reset pagination for the new hotel
    setViewMode('ROOMS');
  };

  const handleBackToHotels = () => {
    setSelectedHotel(null);
    setViewMode('HOTELS');
  };

  // MUTATION HANDLER
  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHotel) return; // Architecture Defense

    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const payload = {
        roomNumber: formData.get("roomNumber"),
        capacity: Number(formData.get("capacity")),
        pricePerNight: Number(formData.get("pricePerNight")),
        roomType: roomType,
        // 🚀 UX FIX: Contextually inherited. The user can't make a mistake anymore.
        hotelId: selectedHotel.id 
      };

      await api.post("/rooms", payload);
      
      setIsCreateModalOpen(false);
      fetchRoomsByHotel(selectedHotel.id, currentPage); // Sync active block grid
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, msg]) => `• ${field}: ${msg}`).join("\n");
        alert(`Validation Failed:\n${errorMessages}`);
      } else {
        alert("Error creating room. Please verify backend logs.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handlePreviousPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };
  const handleNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1); };

  // ========================================================================
  // RENDER: VIEW 1 - MASTER (HOTEL SELECTION)
  // ========================================================================
  if (viewMode === 'HOTELS') {
    return (
      <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Room Inventory</h1>
          <p className="text-zinc-500">Select a hotel branch to manage its specific rooms.</p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-zinc-500 animate-pulse font-medium">Loading network directory...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Card key={hotel.id} className="hover:shadow-md transition-shadow bg-white border-zinc-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-800">
                      <Building2 className="w-5 h-5 text-blue-600" /> {hotel.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                    <MapPin className="w-3 h-3" /> {hotel.city}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" 
                    onClick={() => handleHotelSelect(hotel)}
                  >
                    Manage Rooms &rarr;
                  </Button>
                </CardContent>
              </Card>
            ))}
            {hotels.length === 0 && (
              <p className="col-span-full py-12 text-center border-2 border-dashed rounded-lg text-zinc-500 bg-white">
                No hotels available. Please register a branch first.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ========================================================================
  // RENDER: VIEW 2 - DETAIL (ROOMS LIST FOR SPECIFIC HOTEL)
  // ========================================================================
  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] animate-in fade-in zoom-in-95 duration-200">
      
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={handleBackToHotels} className="mb-2 -ml-2 text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            {selectedHotel?.name}
          </h1>
          <p className="text-zinc-500">Managing inventory for branch: {selectedHotel?.city}</p>
        </div>
        
        {/* ONLY ADMIN CAN CREATE ROOMS */}
        {currentUser?.role === 'ADMIN' && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register New Room</DialogTitle>
                <DialogDescription>Adding capacity to <span className="font-semibold text-blue-600">{selectedHotel?.name}</span>.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input id="roomNumber" name="roomNumber" placeholder="e.g. 101" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (Guests)</Label>
                    <Input id="capacity" name="capacity" type="number" min={1} max={10} placeholder="2" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerNight">Price Per Night (USD)</Label>
                  <Input id="pricePerNight" name="pricePerNight" type="number" step="0.01" min={1} placeholder="99.99" required />
                </div>

                <div className="space-y-2">
                  <Label>Room Classification</Label>
                  <Select onValueChange={setRoomType} value={roomType}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="DOUBLE">Double</SelectItem>
                      <SelectItem value="MATRIMONIAL">Matrimonial</SelectItem>
                      <SelectItem value="SUITE">Suite</SelectItem>
                      <SelectItem value="PRESIDENTIAL">Presidential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full mt-6" disabled={isCreating}>
                  {isCreating ? "Processing..." : "Create Room"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* DATA TABLE */}
      {isLoading ? (
         <div className="py-12 text-center text-zinc-500 animate-pulse font-medium flex-1">Loading floor plans...</div>
      ) : error ? (
         <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200 flex-1">{error}</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden border-zinc-200">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Room #</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Capacity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Price/Night</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {rooms.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No rooms configured for this branch yet.</td></tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-700 flex items-center gap-2">
                        <Bed className="w-4 h-4 text-zinc-400" /> {room.roomNumber}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-medium">
                        {room.roomType}
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {room.capacity} Guests
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          room.roomStatus === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {room.roomStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-blue-600">
                        ${room.pricePerNight}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border rounded-lg shadow-sm border-zinc-200 mt-auto">
            <span className="text-sm text-zinc-500">
              Showing page <span className="font-medium text-zinc-900">{currentPage + 1}</span> of <span className="font-medium text-zinc-900">{totalPages}</span> 
              {" "} ({totalElements} total rooms)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 0}><ChevronLeft className="w-4 h-4" /> Previous</Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages - 1}>Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}