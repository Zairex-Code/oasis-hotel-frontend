/**
 * @file page.tsx (Hotels Management)
 * @description Core administrative interface for managing hotel entities (Branches).
 * Implements full CRUD capabilities using controlled asynchronous forms to prevent React state loss.
 * Features real-time operational status toggling, dynamic search filtering, and a luxurious Detail Modal.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Star, Image as ImageIcon, MoreVertical, Edit, ChevronLeft, ChevronRight, Search, Building2, Filter, Bed, RefreshCw, Sparkles, Globe, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HotelsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Local State Management
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Controllers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hotelToEdit, setHotelToEdit] = useState<Hotel | null>(null); 
  
  // 🚀 Detail Modal Controller
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedHotelDetails, setSelectedHotelDetails] = useState<Hotel | null>(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterName, setFilterName] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchHotels = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true); setError(null);
      let endpoint = `/hotels?page=${pageToFetch}`;
      if (filterName.trim() !== "") endpoint = `/hotels/search/name?name=${encodeURIComponent(filterName)}&page=${pageToFetch}`;
      else if (filterCity.trim() !== "") endpoint = `/hotels/search/city?city=${encodeURIComponent(filterCity)}&page=${pageToFetch}`;
      
      const response = await api.get(endpoint); 
      if (response.data?.content) {
          let loaded = response.data.content;
          if (filterStatus !== "ALL") loaded = loaded.filter((h: Hotel) => h.status === filterStatus);
          setHotels(loaded); setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) { setError("Failed to resolve search parameters."); } finally { setIsLoading(false); }
  };

  useEffect(() => { const timer = setTimeout(() => fetchHotels(currentPage), 300); return () => clearTimeout(timer); }, [currentPage, filterName, filterCity, filterStatus]);

  const handleCreateHotel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await api.post("/hotels", { 
        name: formData.get("name"), address: formData.get("address"), 
        city: formData.get("city"), stars: Number(formData.get("stars")), 
        imageUrl: formData.get("imageUrl") ? String(formData.get("imageUrl")) : null 
      });
      setIsCreateModalOpen(false); fetchHotels(currentPage); 
    } catch (err) { alert("Error parsing payload."); } finally { setIsCreating(false); }
  };

  const handleUpdateHotel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hotelToEdit) return; 
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/hotels/${hotelToEdit.id}`, { 
        name: formData.get("name"), address: formData.get("address"), 
        city: formData.get("city"), stars: Number(formData.get("stars")), 
        imageUrl: formData.get("imageUrl") ? String(formData.get("imageUrl")) : null 
      });
      setIsEditModalOpen(false); setHotelToEdit(null); fetchHotels(currentPage); 
    } catch (err) { alert("Update execution blocked."); } finally { setIsUpdating(false); }
  };

  const handleToggleStatus = async (hotelId: number, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try { await api.put(`/hotels/${hotelId}/status`, { status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }); fetchHotels(currentPage); } catch (err) { alert("Status failure."); }
  };

  // 🚀 Open Details Modal Action
  const openHotelDetails = (hotel: Hotel, e?: React.MouseEvent) => { 
    if (e) e.stopPropagation(); 
    setSelectedHotelDetails(hotel); 
    setIsDetailsModalOpen(true); 
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Building2 className="w-8 h-8 text-primary" /> Ecosystem Branches
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Audit, structure, and filter global hotel infrastructure footprints.</p>
        </div>
        {['ADMIN', 'HOTEL_MANAGER'].includes(user?.role || '') && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 rounded-md font-bold shadow-md shadow-primary/10 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer h-10 px-5">
                <Plus className="w-4 h-4" /> Add New Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] md:max-w-[620px] rounded-md border-border/40 bg-card/95 backdrop-blur-xl p-8 shadow-2xl transition-all ring-1 ring-black/10 dark:ring-white/10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" /> Register Luxury Branch
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">Inject a high-end hospitality asset into the secure network ledger.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateHotel} className="space-y-5 mt-6">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Hotel Identity Name</Label><Input name="name" required placeholder="e.g., Oasis Grand Resort" className="bg-background/40 h-11" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Target City</Label><Input name="city" required placeholder="e.g., Miami" className="bg-background/40 h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Stars Rating</Label><Input name="stars" type="number" min="1" max="5" placeholder="5" required className="bg-background/40 h-11" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Physical Address Layout</Label><Input name="address" required placeholder="e.g., Brickell Ave 240, Luxury District" className="bg-background/40 h-11" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Cover Image Cloud URL Trace</Label><Input name="imageUrl" type="url" placeholder="https://images.unsplash.com/photo-..." className="bg-background/40 h-11" /></div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-8">
                  <Button type="button" variant="ghost" className="rounded-md font-bold cursor-pointer h-11 px-6" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-md font-bold cursor-pointer shadow-lg shadow-primary/20 h-11 px-8 hover:-translate-y-0.5 transition-transform" disabled={isCreating}>{isCreating ? "Saving Entry Asset..." : "Deploy Asset Channel"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* FILTER TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md bg-card/40 backdrop-blur-md border border-border/50 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/10">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><Search className="w-3.5 h-3.5 text-primary" /> Filter by Name</Label>
          <Input placeholder="Search string..." value={filterName} onChange={(e) => { setFilterCity(""); setFilterName(e.target.value); setCurrentPage(0); }} className="bg-background/50 border-border/50 text-sm h-10 shadow-inner" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><MapPin className="w-3.5 h-3.5 text-chart-2" /> Lookup by City</Label>
          <Input placeholder="City keyword index..." value={filterCity} onChange={(e) => { setFilterName(""); setFilterCity(e.target.value); setCurrentPage(0); }} className="bg-background/50 border-border/50 text-sm h-10 shadow-inner" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><Filter className="w-3.5 h-3.5 text-chart-3" /> Status Group</Label>
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}>
            <SelectTrigger className="bg-background/50 border-border/50 text-sm h-10 cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
              <SelectItem value="ALL" className="cursor-pointer">All Operational States</SelectItem>
              <SelectItem value="ACTIVE" className="cursor-pointer">Active Channels Only</SelectItem>
              <SelectItem value="INACTIVE" className="cursor-pointer">Deactivated Branches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CARDS LISTING BLOCK */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Querying database registers...</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              /* 🚀 ENHANCED HOTEL CARDS WITH DEEPER SHADOWS AND LIFT */
              <Card 
                key={hotel.id} 
                onClick={() => openHotelDetails(hotel)}
                className="overflow-hidden border border-border/40 bg-card/40 backdrop-blur-md shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-500 rounded-md flex flex-col justify-between group cursor-pointer dark:hover:ring-1 dark:hover:ring-white/10"
              >
                <div className="relative w-full h-48 bg-muted/20 overflow-hidden">
                  {hotel.imageUrl ? (
                    <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground/30">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  {/* Floating Action Button */}
                  <button 
                    disabled={!['ADMIN', 'HOTEL_MANAGER'].includes(user?.role || '')} 
                    onClick={(e) => handleToggleStatus(hotel.id, hotel.status, e)} 
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border cursor-pointer flex items-center gap-1.5 transition-all duration-300 ${hotel.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30'}`}
                  >
                    <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                    {hotel.status}
                  </button>
                  {/* Gradient to smooth the text underneath */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-black truncate max-w-[200px] group-hover:text-primary transition-colors">{hotel.name}</CardTitle>
                      <div className="flex items-center mt-1.5 space-x-0.5 text-yellow-500">
                        {Array.from({ length: Number(hotel.stars) || 0 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                      </div>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50 cursor-pointer rounded-md">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl p-1 rounded-md">
                          <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Actions Scope</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHotelToEdit(hotel); setIsEditModalOpen(true); }} className="font-medium cursor-pointer hover:bg-primary/10 transition-colors rounded-sm">
                            <Edit className="mr-2 h-4 w-4 text-primary" /> Edit Parameters
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="mt-1 pb-6 pt-0">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    <MapPin className="w-4 h-4 shrink-0 text-primary" />
                    <span className="line-clamp-2 leading-relaxed">{hotel.address}, <span className="font-black text-foreground">{hotel.city}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-md border shadow-sm border-border/50 mt-auto dark:ring-1 dark:ring-white/10 rounded-md">
            <span className="text-sm text-muted-foreground font-medium">Showing page <span className="font-bold text-foreground">{currentPage + 1}</span> of <span className="font-bold text-foreground">{totalPages}</span></span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="font-bold hover:bg-accent/50 cursor-pointer rounded-md">
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="font-bold hover:bg-accent/50 cursor-pointer rounded-md">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL DE DETALLES ULTRA-LUJO REFACTORIZADO */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-border/40 bg-card/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-md dark:ring-1 dark:ring-white/10 animate-in zoom-in-95 duration-300">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedHotelDetails?.name} Details</DialogTitle>
            <DialogDescription>Detailed view of the hotel property.</DialogDescription>
          </DialogHeader>
          
          {selectedHotelDetails && (
            <div className="flex flex-col h-full">
              
              {/* HEADER IMAGE HERO */}
              <div className="relative w-full h-72 bg-muted/20 overflow-hidden group">
                {selectedHotelDetails.imageUrl ? (
                  <img src={selectedHotelDetails.imageUrl} alt={selectedHotelDetails.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-accent/20">
                    <Building2 className="w-16 h-16 opacity-30" />
                  </div>
                )}
                {/* Grandient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                {/* Floating Badge */}
                <div className="absolute top-6 right-6">
                  <span className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-lg backdrop-blur-md ${selectedHotelDetails.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-destructive/20 text-destructive border-destructive/40'}`}>
                    {selectedHotelDetails.status === 'ACTIVE' ? 'Live Operational' : 'Offline'}
                  </span>
                </div>

                {/* Hotel Title & Stars */}
                <div className="absolute bottom-6 left-8 right-8">
                  <h2 className="text-4xl md:text-5xl font-serif font-black text-foreground drop-shadow-xl tracking-tight leading-none mb-3 text-balance">
                    {selectedHotelDetails.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[#D4AF37] drop-shadow-lg">
                    {Array.from({ length: Number(selectedHotelDetails.stars) || 0 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current filter drop-shadow-md" />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* DETAILS CONTENT */}
              <div className="p-8 space-y-6 bg-background">
                
                {/* Info Bar */}
                <div className="flex items-center gap-4 bg-card/40 border border-border/50 p-4 rounded-md shadow-sm transition-colors hover:bg-card/60">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Geographic Coordinates</span>
                    <span className="text-sm font-bold text-foreground">
                      {selectedHotelDetails.address}, <span className="text-primary">{selectedHotelDetails.city}</span>
                    </span>
                  </div>
                </div>

                {/* Description Block */}
                <div className="relative p-6 rounded-md border border-border/30 bg-gradient-to-br from-primary/5 via-background to-background shadow-inner overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <Globe className="w-40 h-40" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" /> Executive Summary
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium relative z-10">
                    Experience world-class hospitality at <strong className="text-foreground">{selectedHotelDetails.name}</strong>. 
                    Located in the prestigious center of {selectedHotelDetails.city}, this {selectedHotelDetails.stars}-star property offers meticulously tailored guest suites, high-density secure access, and unparalleled panoramic luxury configurations designed exclusively for global operators and elite clients.
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-border/40 mt-2">
                  <Button variant="ghost" className="rounded-md font-bold h-12 px-6 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => setIsDetailsModalOpen(false)}>
                    Close Profile
                  </Button>
                  
                  <Button 
                    className="rounded-md font-black shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 h-12 px-8 flex items-center gap-2 cursor-pointer group bg-primary text-primary-foreground" 
                    onClick={() => router.push(`/admin/rooms?hotelId=${selectedHotelDetails.id}`)}
                  >
                    Manage Room Inventory 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[600px] rounded-md border-border/40 bg-card/95 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Mutate Branch Parameters</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">Altering structural keys dynamically synched with live persistence channels.</DialogDescription>
          </DialogHeader>
          {hotelToEdit && (
            <form onSubmit={handleUpdateHotel} className="space-y-4 mt-6">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Hotel Identity Name</Label><Input name="name" defaultValue={hotelToEdit.name} required className="bg-background/40 h-11 animate-hover" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">City Coordinates</Label><Input name="city" defaultValue={hotelToEdit.city} required className="bg-background/40 h-11" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Stars Rank (1-5)</Label><Input name="stars" type="number" min="1" max="5" defaultValue={hotelToEdit.stars} required className="bg-background/40 h-11" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Physical Address</Label><Input name="address" defaultValue={hotelToEdit.address} required className="bg-background/40 h-11" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Asset Image Cloud Trace (Link)</Label><Input name="imageUrl" type="url" defaultValue={hotelToEdit.imageUrl || ''} className="bg-background/40 h-11" /></div>
              <div className="flex justify-end gap-3 pt-6 border-t border-border/40 mt-8">
                <Button type="button" variant="ghost" className="rounded-md font-bold h-11 px-6 cursor-pointer" onClick={() => { setIsEditModalOpen(false); setHotelToEdit(null); }}>Cancel</Button>
                <Button type="submit" className="rounded-md font-bold cursor-pointer shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-transform h-11 px-8 bg-primary text-primary-foreground" disabled={isUpdating}>{isUpdating ? "Processing Mutations..." : "Commit Secure Overwrite"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}