"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Room, Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bed, Plus, ArrowLeft, Building2, ChevronLeft, ChevronRight, MapPin, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RoomsPage() {
  const { user: currentUser } = useAuth();
  
  // ROUTING STATE (Master-Detail Pattern)
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

  // Interactive local filter
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Pagination for Rooms
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // FETCH HOTELS (Master View)
  const fetchHotels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get("/hotels?size=100"); 
      setHotels(res.data.content || []);
    } catch (err) {
      setError("Failed to load the hotel directory.");
    } finally {
      setIsLoading(false);
    }
  };

  // FETCH ROOMS BY CONTEXT HOTEL (Detail View)
  const fetchRoomsByHotel = async (hotelId: number, page: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get(`/rooms/hotelId/${hotelId}?page=${page}`);
      
      let loadedRooms = res.data.content || [];
      
      // Client-side fallback filter for status
      if (filterStatus !== "ALL") {
        loadedRooms = loadedRooms.filter((r: Room) => r.roomStatus === filterStatus);
      }

      setRooms(loadedRooms);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || loadedRooms.length);
    } catch (err) {
      setError("Failed to synchronize room inventory for this branch.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'HOTELS') {
      fetchHotels();
    } else if (viewMode === 'ROOMS' && selectedHotel) {
      fetchRoomsByHotel(selectedHotel.id, currentPage);
    }
  }, [viewMode, currentPage, selectedHotel, filterStatus]);

  // NAVIGATION HANDLERS
  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setCurrentPage(0);
    setFilterStatus("ALL");
    setViewMode('ROOMS');
  };

  const handleBackToHotels = () => {
    setSelectedHotel(null);
    setViewMode('HOTELS');
  };

  // MUTATION HANDLER
  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHotel) return; 

    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const payload = {
        roomNumber: formData.get("roomNumber"),
        capacity: Number(formData.get("capacity")),
        pricePerNight: Number(formData.get("pricePerNight")),
        roomType: roomType,
        hotelId: selectedHotel.id 
      };

      await api.post("/rooms", payload);
      setIsCreateModalOpen(false);
      fetchRoomsByHotel(selectedHotel.id, currentPage); 
    } catch (err: any) {
      alert("Error creating room. Please verify backend logs.");
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
      <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Bed className="w-8 h-8 text-primary" /> Room Inventory
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Select a hotel branch to manage its specific rooms.</p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground animate-pulse font-bold">Loading network directory...</div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Card key={hotel.id} className="hover:shadow-xl transition-all duration-300 bg-card border-border rounded-2xl group cursor-pointer" onClick={() => handleHotelSelect(hotel)}>
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" /> {hotel.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <MapPin className="w-3 h-3" /> {hotel.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-xl shadow-sm">
                    Manage Rooms &rarr;
                  </Button>
                </CardContent>
              </Card>
            ))}
            {hotels.length === 0 && (
              <p className="col-span-full py-16 text-center border border-dashed rounded-2xl font-bold text-muted-foreground bg-card border-border/50">
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
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={handleBackToHotels} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            {selectedHotel?.name}
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Managing inventory for branch: <span className="font-bold text-foreground">{selectedHotel?.city}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* QUICK STATUS FILTER */}
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}>
            <SelectTrigger className="w-[180px] rounded-xl bg-card border-border font-medium shadow-sm">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="ALL">All Rooms</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          {/* ONLY ADMIN CAN CREATE ROOMS */}
          {currentUser?.role === 'ADMIN' && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 rounded-xl font-bold shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4" /> Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Register New Room</DialogTitle>
                  <DialogDescription>Adding capacity to <span className="font-bold text-primary">{selectedHotel?.name}</span>.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Room Number</Label><Input name="roomNumber" placeholder="e.g. 101" required className="rounded-xl" /></div>
                    <div className="space-y-1.5"><Label>Capacity (Guests)</Label><Input name="capacity" type="number" min={1} max={10} required className="rounded-xl" /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Price Per Night (USD)</Label><Input name="pricePerNight" type="number" step="0.01" min={1} required className="rounded-xl" /></div>
                  <div className="space-y-1.5">
                    <Label>Room Classification</Label>
                    <Select onValueChange={setRoomType} value={roomType}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="DOUBLE">Double</SelectItem>
                        <SelectItem value="MATRIMONIAL">Matrimonial</SelectItem>
                        <SelectItem value="SUITE">Suite</SelectItem>
                        <SelectItem value="PRESIDENTIAL">Presidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full mt-6 rounded-xl font-bold" disabled={isCreating}>{isCreating ? "Processing..." : "Create Room"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* DATA TABLE */}
      {isLoading ? (
         <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Loading floor plans...</div>
      ) : error ? (
         <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex-1">{error}</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Room #</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Capacity</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Price/Night</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rooms.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center font-medium text-muted-foreground">No rooms found for this criteria.</td></tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-black text-foreground flex items-center gap-2">
                        <Bed className="w-4 h-4 text-primary" /> {room.roomNumber}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-bold">
                        {room.roomType}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">
                        {room.capacity} Guests
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-black border ${
                          room.roomStatus === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          room.roomStatus === 'MAINTENANCE' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {room.roomStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-foreground">
                        ${room.pricePerNight}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="flex items-center justify-between px-6 py-4 bg-card border rounded-2xl shadow-sm border-border mt-auto">
            <span className="text-sm text-muted-foreground font-medium">
              Page <span className="font-black text-foreground">{currentPage + 1}</span> of <span className="font-black text-foreground">{totalPages}</span> ({totalElements} total rooms)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 0} className="rounded-xl font-bold"><ChevronLeft className="w-4 h-4" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="rounded-xl font-bold">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}