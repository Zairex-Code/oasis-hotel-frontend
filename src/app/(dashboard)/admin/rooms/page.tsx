"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Room, Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bed, Plus, ArrowLeft, Building2, ChevronLeft, ChevronRight, MapPin, Filter, Image as ImageIcon, MoreVertical, Edit, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function RoomsContent() {
  const { user: currentUser } = useAuth();
  
  const searchParams = useSearchParams();
  const hotelIdParam = searchParams.get("hotelId");
  
  const [viewMode, setViewMode] = useState<'HOTELS' | 'ROOMS'>(hotelIdParam ? 'ROOMS' : 'HOTELS');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomType, setRoomType] = useState("SINGLE");

  // 🚀 NUEVO: Estados de Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (hotelIdParam) {
      setIsLoading(true);
      api.get(`/hotels/${hotelIdParam}`)
         .then(res => { setSelectedHotel(res.data); setViewMode('ROOMS'); })
         .catch(err => { console.error("Error", err); setViewMode('HOTELS'); })
         .finally(() => setIsLoading(false));
    }
  }, [hotelIdParam]);

  const fetchHotels = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/hotels?size=100"); 
      setHotels(res.data.content || []);
    } catch (err) { setError("Failed to load directory."); } finally { setIsLoading(false); }
  };

  const fetchRoomsByHotel = async (hotelId: number, page: number = 0) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/rooms/hotelId/${hotelId}?page=${page}`);
      let loadedRooms = res.data.content || [];
      if (filterStatus !== "ALL") loadedRooms = loadedRooms.filter((r: Room) => r.roomStatus === filterStatus);
      setRooms(loadedRooms);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || loadedRooms.length);
    } catch (err) { setError("Failed to sync inventory."); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (viewMode === 'HOTELS' && !hotelIdParam) fetchHotels();
    else if (viewMode === 'ROOMS' && selectedHotel) fetchRoomsByHotel(selectedHotel.id, currentPage);
  }, [viewMode, currentPage, selectedHotel, filterStatus]);

  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel); setCurrentPage(0); setFilterStatus("ALL"); setViewMode('ROOMS');
    window.history.replaceState(null, '', '/admin/rooms'); 
  };

  const handleBackToHotels = () => {
    setSelectedHotel(null); setCurrentPage(0); window.history.replaceState(null, '', '/admin/rooms'); setViewMode('HOTELS');
  };

  // MUTACIÓN: CREAR HABITACIÓN
  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHotel) return; 
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await api.post("/rooms", {
        roomNumber: formData.get("roomNumber"), capacity: Number(formData.get("capacity")),
        pricePerNight: Number(formData.get("pricePerNight")), roomType, hotelId: selectedHotel.id 
      });
      setIsCreateModalOpen(false); fetchRoomsByHotel(selectedHotel.id, currentPage); 
    } catch (err) { alert("Error creating room."); } finally { setIsCreating(false); }
  };

  // 🚀 MUTACIÓN: EDITAR HABITACIÓN
  const handleUpdateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHotel || !roomToEdit) return; 
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/rooms/${roomToEdit.id}`, {
        roomNumber: formData.get("roomNumber"), capacity: Number(formData.get("capacity")),
        pricePerNight: Number(formData.get("pricePerNight")), roomType: formData.get("roomType"), hotelId: selectedHotel.id 
      });
      setIsEditModalOpen(false); fetchRoomsByHotel(selectedHotel.id, currentPage); 
    } catch (err) { alert("Error updating room."); } finally { setIsUpdating(false); }
  };

  // 🚀 MUTACIÓN: CAMBIAR ESTADO DE HABITACIÓN
  const handleStatusChange = async (roomId: number, newStatus: string) => {
    if (!selectedHotel) return;
    try {
      await api.put(`/rooms/${roomId}/status`, { status: newStatus });
      fetchRoomsByHotel(selectedHotel.id, currentPage);
    } catch (err) { alert("Error updating room status."); }
  };

  const openEditModal = (room: Room) => { setRoomToEdit(room); setIsEditModalOpen(true); };

  if (viewMode === 'HOTELS') {
    return (
      <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
        <div className="border-b border-border/50 pb-6">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Bed className="w-8 h-8 text-primary" /> Room Inventory
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Select a hotel branch to manage its specific rooms.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <Card key={hotel.id} onClick={() => handleHotelSelect(hotel)} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/40 backdrop-blur-md border-border/50 rounded-md group cursor-pointer overflow-hidden flex flex-col justify-between dark:hover:ring-1 dark:hover:ring-white/10">
              <div className="relative w-full h-32 bg-muted/20 overflow-hidden">
                {hotel.imageUrl ? <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out" /> : <div className="flex items-center justify-center w-full h-full text-muted-foreground/30"><ImageIcon className="w-10 h-10" /></div>}
              </div>
              <CardHeader className="pb-3 bg-background/30">
                <CardTitle className="text-lg font-black flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Building2 className="w-5 h-5 text-primary" /> {hotel.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1 text-xs font-bold text-muted-foreground uppercase tracking-wider"><MapPin className="w-3 h-3" /> {hotel.city}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 mt-auto">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-md shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md transition-all mt-4 cursor-pointer">
                  Manage Rooms &rarr;
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6 gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={handleBackToHotels} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><Building2 className="w-8 h-8 text-primary" />{selectedHotel?.name}</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Managing inventory for branch: <span className="font-bold text-foreground">{selectedHotel?.city}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}>
            <SelectTrigger className="w-[180px] rounded-md bg-background/50 border-border/50 font-medium shadow-sm hover:border-primary transition-colors cursor-pointer">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="rounded-md border-border/50 bg-card/95 backdrop-blur-xl">
              <SelectItem value="ALL" className="cursor-pointer">All Rooms</SelectItem>
              <SelectItem value="AVAILABLE" className="cursor-pointer">Available</SelectItem>
              <SelectItem value="OCCUPIED" className="cursor-pointer">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE" className="cursor-pointer">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          {currentUser?.role === 'ADMIN' && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 rounded-md font-bold shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle>Register New Room</DialogTitle>
                  <DialogDescription>Adding capacity to <span className="font-bold text-primary">{selectedHotel?.name}</span>.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Room Number</Label><Input name="roomNumber" required className="rounded-md bg-background shadow-inner" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacity</Label><Input name="capacity" type="number" min={1} required className="rounded-md bg-background shadow-inner" /></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Per Night (USD)</Label><Input name="pricePerNight" type="number" step="0.01" min={1} required className="rounded-md bg-background shadow-inner" /></div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Classification</Label>
                    <Select onValueChange={setRoomType} value={roomType}>
                      <SelectTrigger className="rounded-md bg-background border-border/50 shadow-inner cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-md border-border/50 bg-card/95 backdrop-blur-xl">
                        <SelectItem value="SINGLE" className="cursor-pointer">Single</SelectItem>
                        <SelectItem value="DOUBLE" className="cursor-pointer">Double</SelectItem>
                        <SelectItem value="SUITE" className="cursor-pointer">Suite</SelectItem>
                        <SelectItem value="PRESIDENTIAL" className="cursor-pointer">Presidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full mt-6 rounded-md font-bold shadow-lg hover:-translate-y-0.5 transition-transform cursor-pointer" disabled={isCreating}>{isCreating ? "Processing..." : "Create Room"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between space-y-6">
        <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-md shadow-sm overflow-hidden dark:ring-1 dark:ring-white/10">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Room #</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Category</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Capacity</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Price/Night</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-accent/20 hover:shadow-sm transition-all group">
                  <td className="px-6 py-4 font-mono font-black text-foreground flex items-center gap-2"><Bed className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> {room.roomNumber}</td>
                  <td className="px-6 py-4 text-muted-foreground font-bold">{room.roomType}</td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{room.capacity} Guests</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${room.roomStatus === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : room.roomStatus === 'MAINTENANCE' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{room.roomStatus}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-foreground">${room.pricePerNight}</td>
                  <td className="px-6 py-4 text-right">
                    {currentUser?.role === 'ADMIN' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-accent/50 cursor-pointer hover:shadow-md transition-all"><MoreVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl p-1">
                          <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditModal(room)} className="rounded-md font-medium cursor-pointer hover:bg-primary/10 transition-colors"><Edit className="mr-2 h-4 w-4 text-primary" /> Edit Room Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Change Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(room.id, "AVAILABLE")} className="rounded-md font-bold cursor-pointer text-emerald-500 hover:bg-emerald-500/10 transition-colors"><Activity className="mr-2 h-4 w-4" /> Set Available</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(room.id, "MAINTENANCE")} className="rounded-md font-bold cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"><Activity className="mr-2 h-4 w-4" /> Set Maintenance</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 MODAL DE EDICIÓN DE HABITACIÓN */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader><DialogTitle>Edit Room Matrix</DialogTitle><DialogDescription>Modify parameters for Room {roomToEdit?.roomNumber}</DialogDescription></DialogHeader>
          {roomToEdit && (
            <form onSubmit={handleUpdateRoom} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Room Number</Label><Input name="roomNumber" defaultValue={roomToEdit.roomNumber} required className="rounded-md bg-background shadow-inner" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacity</Label><Input name="capacity" defaultValue={roomToEdit.capacity} type="number" min={1} required className="rounded-md bg-background shadow-inner" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Per Night (USD)</Label><Input name="pricePerNight" defaultValue={roomToEdit.pricePerNight} type="number" step="0.01" min={1} required className="rounded-md bg-background shadow-inner" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Classification</Label>
                <Select name="roomType" defaultValue={roomToEdit.roomType}>
                  <SelectTrigger className="rounded-md bg-background border-border/50 shadow-inner cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-md border-border/50 bg-card/95 backdrop-blur-xl">
                    <SelectItem value="SINGLE" className="cursor-pointer">Single</SelectItem>
                    <SelectItem value="DOUBLE" className="cursor-pointer">Double</SelectItem>
                    <SelectItem value="SUITE" className="cursor-pointer">Suite</SelectItem>
                    <SelectItem value="PRESIDENTIAL" className="cursor-pointer">Presidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full mt-6 rounded-md font-bold shadow-lg hover:-translate-y-0.5 transition-transform cursor-pointer" disabled={isUpdating}>{isUpdating ? "Processing..." : "Save Changes"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RoomsPage() {
    return <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen space-y-4"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="text-muted-foreground font-bold text-sm animate-pulse">Loading Room Ecosystem...</p></div>}><RoomsContent /></Suspense>;
}