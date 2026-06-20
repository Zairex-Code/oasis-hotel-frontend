"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Room, Hotel, User } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bed, Plus, ArrowLeft, Building2, ChevronLeft, ChevronRight, MapPin, Filter, Image as ImageIcon, MoreVertical, Edit, Activity, Search, Check, X, CalendarCheck, Sparkles, UserCheck } from "lucide-react";
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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomType, setRoomType] = useState("SINGLE");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  // 🚀 ESTADOS EXPANDIDOS: Modal de Reserva de Alta Gama integrado en la Fila
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [roomToBook, setRoomToBook] = useState<Room | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
      setRooms(loadedRooms); setTotalPages(res.data.totalPages || 1); setTotalElements(res.data.totalElements || loadedRooms.length);
    } catch (err) { setError("Failed to sync inventory."); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (viewMode === 'HOTELS' && !hotelIdParam) fetchHotels();
    else if (viewMode === 'ROOMS' && selectedHotel) fetchRoomsByHotel(selectedHotel.id, currentPage);
  }, [viewMode, currentPage, selectedHotel, filterStatus]);

  useEffect(() => {
    if (userSearchQuery.trim().length < 2) { setUserSearchResults([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const response = await api.get(`/users/search/name?name=${encodeURIComponent(userSearchQuery)}`);
        if (response.data?.content) setUserSearchResults(response.data.content);
        else if (Array.isArray(response.data)) setUserSearchResults(response.data);
      } catch (err) { setUserSearchResults([]); } finally { setIsSearchingUsers(false); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  const handleHotelSelect = (hotel: Hotel) => { setSelectedHotel(hotel); setCurrentPage(0); setFilterStatus("ALL"); setViewMode('ROOMS'); window.history.replaceState(null, '', '/admin/rooms'); };
  const handleBackToHotels = () => { setSelectedHotel(null); setCurrentPage(0); window.history.replaceState(null, '', '/admin/rooms'); setViewMode('HOTELS'); };
  const handlePreviousPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };
  const handleNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1); };

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!selectedHotel) return; setIsCreating(true); const formData = new FormData(e.currentTarget);
    try {
      await api.post("/rooms", { roomNumber: formData.get("roomNumber"), capacity: Number(formData.get("capacity")), pricePerNight: Number(formData.get("pricePerNight")), roomType, hotelId: selectedHotel.id });
      setIsCreateModalOpen(false); fetchRoomsByHotel(selectedHotel.id, currentPage); 
    } catch (err) { alert("Error creating room."); } finally { setIsCreating(false); }
  };

  const handleUpdateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!selectedHotel || !roomToEdit) return; setIsUpdating(true); const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/rooms/${roomToEdit.id}`, { roomNumber: formData.get("roomNumber"), capacity: Number(formData.get("capacity")), pricePerNight: Number(formData.get("pricePerNight")), roomType: formData.get("roomType"), hotelId: selectedHotel.id });
      setIsEditModalOpen(false); fetchRoomsByHotel(selectedHotel.id, currentPage); 
    } catch (err) { alert("Error updating room."); } finally { setIsUpdating(false); }
  };

  const handleStatusChange = async (roomId: number, newStatus: string) => {
    if (!selectedHotel) return;
    try { await api.put(`/rooms/${roomId}/status`, { status: newStatus }); fetchRoomsByHotel(selectedHotel.id, currentPage); } catch (err) { alert("Error updating room status."); }
  };

  // 🚀 CONTROLADOR DE LOGICA OPERACIONAL DE RESERVA INSTANTÁNEA
  const handleBookRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser || !roomToBook) { alert("Please select a guest profile layout."); return; }
    setIsBooking(true); const formData = new FormData(e.currentTarget);
    try {
      await api.post("/reservations", {
        userId: selectedUser.id, roomId: roomToBook.id, checkInDate: formData.get("checkInDate"),
        checkOutDate: formData.get("checkOutDate"), numberOfGuests: Number(formData.get("numberOfGuests"))
      });
      setIsBookModalOpen(false); setRoomToBook(null); setSelectedUser(null); setUserSearchQuery("");
      alert("Ledger Window Fixed: Reservation processed successfully.");
      fetchRoomsByHotel(selectedHotel!.id, currentPage);
    } catch (err) { alert("Overbooking / Validation Boundary Blocked."); } finally { setIsBooking(false); }
  };

  const openEditModal = (room: Room, e: React.MouseEvent) => { e.stopPropagation(); setRoomToEdit(room); setIsEditModalOpen(true); };
  const openBookModal = (room: Room) => { if(room.roomStatus === 'MAINTENANCE') { alert("This room asset is currently flagged for maintenance."); return; } setRoomToBook(room); setIsBookModalOpen(true); };

  if (viewMode === 'HOTELS') {
    return (
      <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
        <div className="border-b border-border/50 pb-6"><h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><Bed className="w-8 h-8 text-primary" /> Room Inventory</h1><p className="text-muted-foreground font-medium text-sm mt-1">Select a hotel branch to manage its specific rooms.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <Card key={hotel.id} onClick={() => handleHotelSelect(hotel)} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/40 backdrop-blur-md border-border/50 rounded-md group cursor-pointer overflow-hidden flex flex-col justify-between dark:hover:ring-1 dark:hover:ring-white/10">
              <div className="relative w-full h-32 bg-muted/20 overflow-hidden">{hotel.imageUrl ? <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out" /> : <div className="flex items-center justify-center w-full h-full text-muted-foreground/30"><ImageIcon className="w-10 h-10" /></div>}</div>
              <CardHeader className="pb-3 bg-background/30"><CardTitle className="text-lg font-black flex items-center gap-2 group-hover:text-primary transition-colors"><Building2 className="w-5 h-5 text-primary" /> {hotel.name}</CardTitle><CardDescription className="flex items-center gap-1 mt-1 text-xs font-bold text-muted-foreground uppercase tracking-wider"><MapPin className="w-3 h-3" /> {hotel.city}</CardDescription></CardHeader>
              <CardContent className="p-6 pt-0 mt-auto"><Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-md shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md transition-all mt-4 cursor-pointer">Manage Rooms &rarr;</Button></CardContent>
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
          <Button variant="ghost" size="sm" onClick={handleBackToHotels} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory</Button>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><Building2 className="w-8 h-8 text-primary" />{selectedHotel?.name}</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Managing inventory for branch: <span className="font-bold text-foreground">{selectedHotel?.city}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}>
            <SelectTrigger className="w-[180px] bg-background/50 border-border/50 font-medium shadow-sm hover:border-primary transition-colors cursor-pointer">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
              <SelectItem value="ALL" className="cursor-pointer">All Rooms</SelectItem>
              <SelectItem value="AVAILABLE" className="cursor-pointer">Available</SelectItem>
              <SelectItem value="OCCUPIED" className="cursor-pointer">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE" className="cursor-pointer">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          {currentUser?.role === 'ADMIN' && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild><Button className="flex items-center gap-2 font-bold shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer h-10 px-5"><Plus className="w-4 h-4" /> Add Room</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[500px] md:max-w-[580px] border-border/50 bg-card/95 backdrop-blur-xl p-8 shadow-2xl rounded-md ring-1 ring-black/10">
                <DialogHeader><DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2"><Plus className="w-5 h-5 text-primary"/> Register Room Asset</DialogTitle><DialogDescription className="text-sm mt-1">Adding capacity allocation maps into <span className="font-bold text-primary">{selectedHotel?.name}</span>.</DialogDescription></DialogHeader>
                <form onSubmit={handleCreateRoom} className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Room Number</Label><Input name="roomNumber" placeholder="e.g. 101" required className="bg-background h-11" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Capacity (Guests)</Label><Input name="capacity" type="number" min={1} required className="bg-background h-11" /></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Price Per Night (USD)</Label><Input name="pricePerNight" type="number" step="0.01" min={1} required className="bg-background h-11" /></div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Classification</Label>
                    <Select onValueChange={setRoomType} value={roomType}>
                      <SelectTrigger className="bg-background border-border/50 h-11 cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                        <SelectItem value="SINGLE" className="cursor-pointer">Single Suite</SelectItem>
                        <SelectItem value="DOUBLE" className="cursor-pointer">Double Deluxe</SelectItem>
                        <SelectItem value="SUITE" className="cursor-pointer">Executive Suite</SelectItem>
                        <SelectItem value="PRESIDENTIAL" className="cursor-pointer">Presidential Sanctuary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-8">
                    <Button type="button" variant="ghost" className="rounded-md font-bold h-11 px-6 cursor-pointer" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="rounded-md font-bold cursor-pointer bg-primary text-primary-foreground shadow-lg h-11 px-8" disabled={isCreating}>Deploy Room Unit</Button>
                  </div>
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
              <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Room Number</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Category Classification</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Density Cap</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Current Status</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Price / Stay</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Manage</th></tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rooms.map((room) => (
                /* 🚀 ACCIÓN REFACTORIZADA: Toda la fila ahora despliega el Modal de Reservas si está clickeado */
                <tr key={room.id} onClick={() => openBookModal(room)} className="hover:bg-accent/20 hover:shadow-sm transition-all group cursor-pointer">
                  <td className="px-6 py-4 font-mono font-black text-foreground flex items-center gap-2"><Bed className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> {room.roomNumber}</td>
                  <td className="px-6 py-4 text-muted-foreground font-bold">{room.roomType}</td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{room.capacity} Guests Max</td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${room.roomStatus === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : room.roomStatus === 'MAINTENANCE' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{room.roomStatus}</span></td>
                  <td className="px-6 py-4 text-right font-black text-foreground">${room.pricePerNight}</td>
                  <td className="px-6 py-4 text-right">
                    {currentUser?.role === 'ADMIN' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50 cursor-pointer hover:shadow-md transition-all"><MoreVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl p-1"><DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={(e) => openEditModal(room, e)} className="font-medium cursor-pointer hover:bg-primary/10 transition-colors rounded-sm"><Edit className="mr-2 h-4 w-4 text-primary" /> Edit Room Details</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Change Status</DropdownMenuLabel><DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(room.id, "AVAILABLE"); }} className="rounded-sm font-bold cursor-pointer text-emerald-500 hover:bg-emerald-500/10 transition-colors"><Activity className="mr-2 h-4 w-4" /> Set Available</DropdownMenuItem><DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(room.id, "MAINTENANCE"); }} className="rounded-sm font-bold cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"><Activity className="mr-2 h-4 w-4" /> Set Maintenance</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-md border shadow-sm border-border/50 mt-auto dark:ring-1 dark:ring-white/10 rounded-md"><span className="text-sm text-muted-foreground font-medium">Page <span className="font-bold text-foreground">{currentPage + 1}</span> of <span className="font-bold text-foreground">{totalPages}</span> ({totalElements} total rooms)</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 0} className="font-bold hover:bg-accent/50 cursor-pointer"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button><Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="font-bold hover:bg-accent/50 cursor-pointer">Next <ChevronRight className="w-4 h-4 ml-1" /></Button></div></div>
      </div>

      {/* MODAL DE EDICIÓN AMPLIO */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] md:max-w-[580px] border-border/50 bg-card/95 backdrop-blur-xl p-8 shadow-2xl rounded-md ring-1 ring-black/10">
          <DialogHeader><DialogTitle className="text-2xl font-black tracking-tight">Edit Room Metrics</DialogTitle><DialogDescription className="text-sm mt-1">Modify architectural indices for Unit Unit {roomToEdit?.roomNumber}</DialogDescription></DialogHeader>
          {roomToEdit && (
            <form onSubmit={handleUpdateRoom} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Room Number</Label><Input name="roomNumber" defaultValue={roomToEdit.roomNumber} required className="bg-background h-11" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Capacity</Label><Input name="capacity" defaultValue={roomToEdit.capacity} type="number" min={1} required className="bg-background h-11" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Price Per Night (USD)</Label><Input name="pricePerNight" defaultValue={roomToEdit.pricePerNight} type="number" step="0.01" min={1} required className="bg-background h-11" /></div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Classification</Label>
                <Select name="roomType" defaultValue={roomToEdit.roomType}>
                  <SelectTrigger className="bg-background border-border/50 h-11 cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                    <SelectItem value="SINGLE" className="cursor-pointer">Single Suite</SelectItem>
                    <SelectItem value="DOUBLE" className="cursor-pointer">Double Deluxe</SelectItem>
                    <SelectItem value="SUITE" className="cursor-pointer">Executive Suite</SelectItem>
                    <SelectItem value="PRESIDENTIAL" className="cursor-pointer">Presidential Sanctuary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-8">
                <Button type="button" variant="ghost" className="rounded-md font-bold h-11 px-6 cursor-pointer" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="rounded-md font-bold cursor-pointer shadow-md hover:-translate-y-0.5 transition-transform h-11 px-8" disabled={isUpdating}>Save Configuration Updates</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 🚀 MODAL DE RESERVACIÓN EN FILA: REFACTORIZADO Y ELEGANTE (MÁS ANCHO) */}
      <Dialog open={isBookModalOpen} onOpenChange={(open) => { setIsBookModalOpen(open); if (!open) { setSelectedUser(null); setUserSearchQuery(""); }}}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[620px] border-border/40 bg-card/95 backdrop-blur-xl p-8 shadow-2xl rounded-md ring-1 ring-black/10 dark:ring-white/10 animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-primary animate-pulse"/> Initialize Reservation Window</DialogTitle>
            <DialogDescription className="text-sm mt-1 font-medium text-muted-foreground">Assigning Guest Clearance to <span className="font-bold text-foreground">Unit {roomToBook?.roomNumber} ({roomToBook?.roomType})</span>.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookRoom} className="space-y-4 mt-6">
            
            <div className="space-y-1.5 relative">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Huésped Database Lookup</Label>
              {!selectedUser ? (
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Type customer first or last name to index database..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="pl-10 h-11 bg-background/50 border-border/50 shadow-inner" required={!selectedUser} />
                  {userSearchQuery.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-md z-50 divide-y divide-border/30">
                      {isSearchingUsers ? <div className="p-4 text-xs font-bold text-muted-foreground text-center animate-pulse">Scanning network...</div> : userSearchResults.length === 0 ? <div className="p-4 text-xs font-bold text-muted-foreground text-center">No identities discovered.</div> : userSearchResults.map((u) => (
                          <div key={u.id} onClick={() => setSelectedUser(u)} className="p-3 hover:bg-accent/50 flex items-center justify-between cursor-pointer text-sm transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center uppercase">{u.firstName.charAt(0)}{u.lastName?.charAt(0) || ""}</div>
                              <div><p className="font-bold text-foreground text-sm">{u.firstName} {u.lastName}</p><p className="text-[10px] text-muted-foreground font-medium">{u.email}</p></div>
                            </div>
                            <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-background/40 border border-border/50 rounded-md flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground font-black flex items-center justify-center uppercase shadow-md text-sm">{selectedUser.firstName.charAt(0)}{selectedUser.lastName?.charAt(0) || ""}</div>
                    <div><p className="font-black text-foreground text-base leading-tight">{selectedUser.firstName} {selectedUser.lastName}</p><p className="text-xs font-medium text-muted-foreground">{selectedUser.email}</p></div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedUser(null); setUserSearchQuery(""); }} className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-md"><X className="w-4 h-4" /></Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-in Stay Window</Label><Input name="checkInDate" type="date" required className="bg-background h-11" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-out Settlement</Label><Input name="checkOutDate" type="date" required className="bg-background h-11" /></div>
            </div>
            
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Number of Active Guests</Label><Input name="numberOfGuests" type="number" min={1} max={roomToBook?.capacity || 10} required className="bg-background h-11" placeholder={`Maximum unit capacity threshold is ${roomToBook?.capacity}`} /></div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-8">
              <Button type="button" variant="ghost" className="rounded-md font-bold h-11 px-6 cursor-pointer" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-md font-bold cursor-pointer shadow-lg h-11 px-8 bg-primary text-primary-foreground" disabled={isBooking}>{isBooking ? "Validating Tokens..." : "Lock Booking Transaction"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RoomsPage() {
    return <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen space-y-4"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="text-muted-foreground font-bold text-sm animate-pulse">Loading Room Ecosystem...</p></div>}><RoomsContent /></Suspense>;
}