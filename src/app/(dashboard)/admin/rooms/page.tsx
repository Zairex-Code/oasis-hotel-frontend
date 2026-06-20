/**
 * @file page.tsx (Rooms Management & Instant Booking)
 * @description Inventory management interface linked intrinsically to Hotel entities.
 * Utilizes URL Search Parameters (`hotelId`) for dynamic view switching without router push.
 * Integrates an advanced Debounced Async Search engine to provision instant reservations directly from the table layout.
 */

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
import { Bed, Plus, ArrowLeft, Building2, ChevronLeft, ChevronRight, MapPin, Filter, Image as ImageIcon, MoreVertical, Edit, Activity, Search, Check, X, CalendarCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function RoomsContent() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const hotelIdParam = searchParams.get("hotelId");
  
  // Dual-View Engine: 'HOTELS' grid or 'ROOMS' table based on context
  const [viewMode, setViewMode] = useState<'HOTELS' | 'ROOMS'>(hotelIdParam ? 'ROOMS' : 'HOTELS');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomType, setRoomType] = useState("SINGLE");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  // 🚀 Instant Booking Engine States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [roomToBook, setRoomToBook] = useState<Room | null>(null);
  
  // 🚀 Debounced Search States
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // ... (Fetch effect hooks simplified for space, keeping logic intact)
  useEffect(() => {
    if (hotelIdParam) {
      setIsLoading(true); api.get(`/hotels/${hotelIdParam}`).then(res => { setSelectedHotel(res.data); setViewMode('ROOMS'); }).finally(() => setIsLoading(false));
    }
  }, [hotelIdParam]);

  const fetchHotels = async () => { setIsLoading(true); try { const res = await api.get("/hotels?size=100"); setHotels(res.data.content || []); } finally { setIsLoading(false); } };
  const fetchRoomsByHotel = async (hotelId: number, page: number = 0) => {
    setIsLoading(true); try {
      const res = await api.get(`/rooms/hotelId/${hotelId}?page=${page}`);
      let loadedRooms = res.data.content || [];
      if (filterStatus !== "ALL") loadedRooms = loadedRooms.filter((r: Room) => r.roomStatus === filterStatus);
      setRooms(loadedRooms); setTotalPages(res.data.totalPages || 1); setTotalElements(res.data.totalElements || loadedRooms.length);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (viewMode === 'HOTELS' && !hotelIdParam) fetchHotels();
    else if (viewMode === 'ROOMS' && selectedHotel) fetchRoomsByHotel(selectedHotel.id, currentPage);
  }, [viewMode, currentPage, selectedHotel, filterStatus]);

  /**
   * DEBOUNCED SEARCH ENGINE
   * Optimizes backend queries by awaiting user input pause (300ms) before hitting the network.
   */
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

  const handleCreateRoom = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!selectedHotel) return; setIsCreating(true); const formData = new FormData(e.currentTarget); try { await api.post("/rooms", { roomNumber: formData.get("roomNumber"), capacity: Number(formData.get("capacity")), pricePerNight: Number(formData.get("pricePerNight")), roomType, hotelId: selectedHotel.id }); setIsCreateModalOpen(false); fetchRoomsByHotel(selectedHotel.id, currentPage); } finally { setIsCreating(false); } };
  const handleUpdateRoom = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!selectedHotel || !roomToEdit) return; setIsUpdating(true); const formData = new FormData(e.currentTarget); try { await api.put(`/rooms/${roomToEdit.id}`, { roomNumber: formData.get("roomNumber"), capacity: Number(formData.get("capacity")), pricePerNight: Number(formData.get("pricePerNight")), roomType: formData.get("roomType"), hotelId: selectedHotel.id }); setIsEditModalOpen(false); fetchRoomsByHotel(selectedHotel.id, currentPage); } finally { setIsUpdating(false); } };
  const handleStatusChange = async (roomId: number, newStatus: string) => { if (!selectedHotel) return; try { await api.put(`/rooms/${roomId}/status`, { status: newStatus }); fetchRoomsByHotel(selectedHotel.id, currentPage); } catch (err) { alert("Error."); } };

  /**
   * Cross-Entity Transaction: Processes a Reservation via the Room interface.
   */
  const handleBookRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser || !roomToBook) { alert("Please select a guest profile layout."); return; }
    setIsBooking(true); const formData = new FormData(e.currentTarget);
    try {
      await api.post("/reservations", { userId: selectedUser.id, roomId: roomToBook.id, checkInDate: formData.get("checkInDate"), checkOutDate: formData.get("checkOutDate"), numberOfGuests: Number(formData.get("numberOfGuests")) });
      setIsBookModalOpen(false); setRoomToBook(null); setSelectedUser(null); setUserSearchQuery("");
      alert("Ledger Window Fixed: Reservation processed successfully."); fetchRoomsByHotel(selectedHotel!.id, currentPage);
    } catch (err) { alert("Overbooking / Validation Boundary Blocked."); } finally { setIsBooking(false); }
  };

  const openBookModal = (room: Room) => { if(room.roomStatus === 'MAINTENANCE') { alert("Flagged for maintenance."); return; } setRoomToBook(room); setIsBookModalOpen(true); };
  const handleHotelSelect = (hotel: Hotel) => { setSelectedHotel(hotel); setCurrentPage(0); setFilterStatus("ALL"); setViewMode('ROOMS'); window.history.replaceState(null, '', '/admin/rooms'); };
  const handleBackToHotels = () => { setSelectedHotel(null); setCurrentPage(0); window.history.replaceState(null, '', '/admin/rooms'); setViewMode('HOTELS'); };

  if (viewMode === 'HOTELS') {
    return (
      <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
        <div className="border-b border-border/50 pb-6"><h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><Bed className="w-8 h-8 text-primary" /> Room Inventory</h1><p className="text-muted-foreground font-medium text-sm mt-1">Select a hotel branch to manage its specific rooms.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <Card key={hotel.id} onClick={() => handleHotelSelect(hotel)} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/40 backdrop-blur-md border-border/50 rounded-md group cursor-pointer overflow-hidden flex flex-col justify-between">
              <div className="relative w-full h-32 bg-muted/20 overflow-hidden">{hotel.imageUrl ? <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out" /> : <div className="flex items-center justify-center w-full h-full text-muted-foreground/30"><ImageIcon className="w-10 h-10" /></div>}</div>
              <CardHeader className="pb-3 bg-background/30"><CardTitle className="text-lg font-black flex items-center gap-2 group-hover:text-primary transition-colors"><Building2 className="w-5 h-5 text-primary" /> {hotel.name}</CardTitle></CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6 gap-4">
        <div className="space-y-1"><Button variant="ghost" size="sm" onClick={handleBackToHotels} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory</Button><h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><Building2 className="w-8 h-8 text-primary" />{selectedHotel?.name}</h1></div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}><SelectTrigger className="w-[180px] bg-background/50 border-border/50 font-medium shadow-sm hover:border-primary transition-colors cursor-pointer"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Filter Status" /></SelectTrigger><SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl"><SelectItem value="ALL" className="cursor-pointer">All Rooms</SelectItem><SelectItem value="AVAILABLE" className="cursor-pointer">Available</SelectItem><SelectItem value="OCCUPIED" className="cursor-pointer">Occupied</SelectItem></SelectContent></Select>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between space-y-6">
        <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-md shadow-sm overflow-hidden dark:ring-1 dark:ring-white/10">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
              <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Room Number</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Category Classification</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Density Cap</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Current Status</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Price / Stay</th></tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rooms.map((room) => (
                <tr key={room.id} onClick={() => openBookModal(room)} className="hover:bg-accent/20 hover:shadow-sm transition-all group cursor-pointer">
                  <td className="px-6 py-4 font-mono font-black text-foreground flex items-center gap-2"><Bed className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> {room.roomNumber}</td>
                  <td className="px-6 py-4 text-muted-foreground font-bold">{room.roomType}</td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{room.capacity} Guests Max</td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${room.roomStatus === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{room.roomStatus}</span></td>
                  <td className="px-6 py-4 text-right font-black text-foreground">${room.pricePerNight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isBookModalOpen} onOpenChange={(open) => { setIsBookModalOpen(open); if (!open) { setSelectedUser(null); setUserSearchQuery(""); }}}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[620px] border-border/40 bg-card/95 backdrop-blur-xl p-8 shadow-2xl rounded-md ring-1 ring-black/10 dark:ring-white/10 animate-in zoom-in-95 duration-200">
          <DialogHeader><DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2"><CalendarCheck className="w-6 h-6 text-primary animate-pulse"/> Initialize Reservation Window</DialogTitle></DialogHeader>
          <form onSubmit={handleBookRoom} className="space-y-4 mt-6">
            <div className="space-y-1.5 relative"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Huésped Database Lookup</Label>
              {!selectedUser ? (
                <div className="relative"><Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Type customer name to index database..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="pl-10 h-11 bg-background/50 border-border/50 shadow-inner" required={!selectedUser} />
                  {userSearchQuery.trim().length >= 2 && (<div className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-md z-50 divide-y divide-border/30">{isSearchingUsers ? <div className="p-4 text-center">Scanning...</div> : userSearchResults.map((u) => (<div key={u.id} onClick={() => setSelectedUser(u)} className="p-3 hover:bg-accent/50 flex items-center justify-between cursor-pointer">{u.firstName}</div>))}</div>)}
                </div>
              ) : (
                <div className="p-4 bg-background/40 border border-border/50 rounded-md flex items-center justify-between shadow-sm animate-in fade-in duration-200"><p className="font-black">{selectedUser.firstName} {selectedUser.lastName}</p><Button type="button" variant="ghost" onClick={() => setSelectedUser(null)}><X className="w-4 h-4" /></Button></div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Check-in</Label><Input name="checkInDate" type="date" required className="bg-background h-11" /></div><div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Check-out</Label><Input name="checkOutDate" type="date" required className="bg-background h-11" /></div></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Number of Active Guests</Label><Input name="numberOfGuests" type="number" min={1} max={roomToBook?.capacity || 10} required className="bg-background h-11" /></div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-8"><Button type="button" variant="ghost" className="rounded-md font-bold h-11 px-6 cursor-pointer" onClick={() => setIsBookModalOpen(false)}>Cancel</Button><Button type="submit" className="rounded-md font-bold cursor-pointer shadow-lg h-11 px-8 bg-primary text-primary-foreground" disabled={isBooking}>Lock Booking Transaction</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default function RoomsPage() { return <Suspense fallback={<div className="flex flex-center">Loading...</div>}><RoomsContent /></Suspense>; }