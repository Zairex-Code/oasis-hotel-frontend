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
import { Plus, MapPin, Star, Image as ImageIcon, MoreVertical, Edit, Power, ChevronLeft, ChevronRight, Search, Building2, Filter, Bed, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HotelsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hotelToEdit, setHotelToEdit] = useState<Hotel | null>(null); 

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedHotelDetails, setSelectedHotelDetails] = useState<Hotel | null>(null);

  // Paginación y Filtros
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filterName, setFilterName] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchHotels = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      let endpoint = `/hotels?page=${pageToFetch}`;
      
      if (filterName.trim() !== "") {
        endpoint = `/hotels/search/name?name=${encodeURIComponent(filterName)}&page=${pageToFetch}`;
      } else if (filterCity.trim() !== "") {
        endpoint = `/hotels/search/city?city=${encodeURIComponent(filterCity)}&page=${pageToFetch}`;
      }

      const response = await api.get(endpoint); 
      
      if (response.data?.content) {
          let loaded = response.data.content;
          if (filterStatus !== "ALL") {
            loaded = loaded.filter((h: Hotel) => h.status === filterStatus);
          }
          setHotels(loaded);
          setTotalPages(response.data.totalPages || 1);
          setTotalElements(response.data.totalElements || loaded.length);
      }
    } catch (err: any) {
      setError("Failed to resolve search parameters against database indexes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchHotels(currentPage), 300);
    return () => clearTimeout(timer);
  }, [currentPage, filterName, filterCity, filterStatus]);

  const handleCreateHotel = async (formData: FormData) => {
    setIsCreating(true);
    try {
      const newHotelData = {
        name: formData.get("name"), address: formData.get("address"),
        city: formData.get("city"), stars: Number(formData.get("stars")),
        imageUrl: formData.get("imageUrl") || null,
      };
      await api.post("/hotels", newHotelData);
      setIsCreateModalOpen(false);
      fetchHotels(currentPage); 
    } catch (err: any) { alert("Error parsing payload."); } finally { setIsCreating(false); }
  };

  const handleUpdateHotel = async (formData: FormData) => {
    if (!hotelToEdit) return; 
    setIsUpdating(true);
    try {
      const updatedData = {
        name: formData.get("name"), address: formData.get("address"),
        city: formData.get("city"), stars: Number(formData.get("stars")),
        imageUrl: formData.get("imageUrl") || null,
      };
      await api.put(`/hotels/${hotelToEdit.id}`, updatedData);
      setIsEditModalOpen(false);
      setHotelToEdit(null); 
      fetchHotels(currentPage); 
    } catch (err) { alert("Update execution blocked."); } finally { setIsUpdating(false); }
  };

  // 🚀 DISPARADOR EN VIVO: Mutación de estado conectada directamente
  const handleToggleStatus = async (hotelId: number, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Previene abrir el modal descriptivo al hacer clic aquí
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/hotels/${hotelId}/status`, { status: newStatus });
      fetchHotels(currentPage);
    } catch (err) { alert("Status mutation failure."); }
  };

  const openHotelDetails = (hotel: Hotel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedHotelDetails(hotel);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      
      {/* HEADER */}
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
              <Button className="flex items-center gap-2 rounded-md font-bold shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add New Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle>Register New Branch</DialogTitle>
                <DialogDescription>Fill out the profile metrics to inject a new branch entity.</DialogDescription>
              </DialogHeader>
              <form action={handleCreateHotel} className="space-y-4 mt-4">
                <div className="space-y-1.5"><Label>Hotel Name</Label><Input name="name" required className="rounded-md bg-background" /></div>
                <div className="space-y-1.5"><Label>Target City</Label><Input name="city" required className="rounded-md bg-background" /></div>
                <div className="space-y-1.5"><Label>Full Address</Label><Input name="address" required className="rounded-md bg-background" /></div>
                <div className="space-y-1.5"><Label>Stars (1-5)</Label><Input name="stars" type="number" min="1" max="5" required className="rounded-md bg-background" /></div>
                <div className="space-y-1.5"><Label>Cover URL</Label><Input name="imageUrl" type="url" className="rounded-md bg-background" /></div>
                <Button type="submit" className="w-full mt-6 rounded-md font-bold cursor-pointer" disabled={isCreating}>{isCreating ? "Saving entry..." : "Save Hotel branch"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* FILTER TOOLBAR (BORDES RADIUS EN MD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md bg-card/40 backdrop-blur-md border border-border/50 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/10">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><Search className="w-3.5 h-3.5 text-primary" /> Filter by Name</Label>
          <Input placeholder="Search string (e.g. Oasis Premium)..." value={filterName} onChange={(e) => { setFilterCity(""); setFilterName(e.target.value); setCurrentPage(0); }} className="rounded-md bg-background/50 border-border/50 text-sm h-10 shadow-inner" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><MapPin className="w-3.5 h-3.5 text-chart-2" /> Lookup by City</Label>
          <Input placeholder="City keyword index (e.g. Miami)..." value={filterCity} onChange={(e) => { setFilterName(""); setFilterCity(e.target.value); setCurrentPage(0); }} className="rounded-md bg-background/50 border-border/50 text-sm h-10 shadow-inner" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><Filter className="w-3.5 h-3.5 text-chart-3" /> Status Group</Label>
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}>
            <SelectTrigger className="rounded-md bg-background/50 border-border/50 text-sm h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-md border-border/50 bg-card/95 backdrop-blur-xl">
              <SelectItem value="ALL">All Operational States</SelectItem>
              <SelectItem value="ACTIVE">Active Channels Only</SelectItem>
              <SelectItem value="INACTIVE">Deactivated Branches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LISTINGS BLOCK */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Querying database registers...</div>
      ) : error ? (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex-1">{error}</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Card 
                key={hotel.id} 
                onClick={() => openHotelDetails(hotel)}
                className="overflow-hidden border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-md flex flex-col justify-between group cursor-pointer dark:hover:ring-1 dark:hover:ring-white/10"
              >
                <div className="relative w-full h-44 bg-muted/20 overflow-hidden">
                  {hotel.imageUrl ? (
                    <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground/30"><ImageIcon className="w-10 h-10" /></div>
                  )}
                  
                  {/* 🚀 SOLUCIÓN EN VIVO: El Badge ahora es un botón interactivo para alternar estados si eres Admin/Manager */}
                  <button
                    disabled={!['ADMIN', 'HOTEL_MANAGER'].includes(user?.role || '')}
                    onClick={(e) => handleToggleStatus(hotel.id, hotel.status, e)}
                    className={`absolute top-4 right-4 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border cursor-pointer flex items-center gap-1.5 transition-all duration-300 ${
                        hotel.status === 'ACTIVE' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                        : 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30'
                    }`}
                    title="Click to toggle branch operational state"
                  >
                    <RefreshCw className="w-2.5 h-2.5 animate-hover group-hover:rotate-180 transition-transform" />
                    {hotel.status}
                  </button>
                </div>
                
                <CardHeader className="pb-2">
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
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-accent/50 cursor-pointer"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl">
                          <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Actions Scope</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHotelToEdit(hotel); setIsEditModalOpen(true); }} className="rounded-md font-medium cursor-pointer"><Edit className="mr-2 h-4 w-4 text-primary" /> Edit Parameters</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="mt-2 pt-0 p-6 bg-gradient-to-t from-background/40 to-transparent">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground font-medium">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span className="line-clamp-2">{hotel.address}, <span className="font-bold text-foreground">{hotel.city}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-md border rounded-md shadow-sm border-border/50 mt-auto dark:ring-1 dark:ring-white/10">
            <span className="text-sm text-muted-foreground font-medium">
              Showing page <span className="font-bold text-foreground">{currentPage + 1}</span> of <span className="font-bold text-foreground">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="rounded-md font-bold hover:bg-accent/50 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="rounded-md font-bold hover:bg-accent/50 cursor-pointer">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DEL HOTEL */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border/50 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-md dark:ring-1 dark:ring-white/10">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedHotelDetails?.name} Details</DialogTitle>
            <DialogDescription>Detailed view of the hotel property.</DialogDescription>
          </DialogHeader>

          {selectedHotelDetails && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="relative w-full h-56 bg-muted/20">
                {selectedHotelDetails.imageUrl ? (
                  <img src={selectedHotelDetails.imageUrl} alt={selectedHotelDetails.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Building2 className="w-12 h-12 opacity-50" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <h2 className="text-3xl font-black text-foreground drop-shadow-md tracking-tight">{selectedHotelDetails.name}</h2>
                  <div className="flex items-center gap-1 mt-1 text-yellow-500 drop-shadow-md">
                    {Array.from({ length: Number(selectedHotelDetails.stars) || 0 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-background/50 px-3 py-2 rounded-md border border-border/50">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{selectedHotelDetails.address}, <strong className="text-foreground">{selectedHotelDetails.city}</strong></span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                      selectedHotelDetails.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-destructive/20 text-destructive border-destructive/30'
                  }`}>
                    {selectedHotelDetails.status}
                  </span>
                </div>

                <div className="space-y-2 bg-background/30 p-4 rounded-md border border-border/30 shadow-inner">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-primary">About the property</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Experience world-class hospitality at {selectedHotelDetails.name}. Located in the heart of {selectedHotelDetails.city}, this {selectedHotelDetails.stars}-star property offers exclusive amenities, breathtaking views, and unparalleled comfort.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button variant="ghost" className="rounded-md hover:bg-accent/50 cursor-pointer" onClick={() => setIsDetailsModalOpen(false)}>Close Window</Button>
                  <Button 
                    className="rounded-md bg-primary text-primary-foreground font-bold shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all group cursor-pointer"
                    onClick={() => router.push(`/admin/rooms?hotelId=${selectedHotelDetails.id}`)}
                  >
                    View & Manage Rooms <Bed className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-md border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader><DialogTitle>Edit Hotel Metrics</DialogTitle></DialogHeader>
          {hotelToEdit && (
            <form action={handleUpdateHotel} className="space-y-4 mt-4">
              <div className="space-y-1.5"><Label>Hotel Name</Label><Input name="name" defaultValue={hotelToEdit.name} required className="rounded-md bg-background" /></div>
              <div className="space-y-1.5"><Label>City</Label><Input name="city" defaultValue={hotelToEdit.city} required className="rounded-md bg-background" /></div>
              <div className="space-y-1.5"><Label>Address</Label><Input name="address" defaultValue={hotelToEdit.address} required className="rounded-md bg-background" /></div>
              <div className="space-y-1.5"><Label>Stars (1-5)</Label><Input name="stars" type="number" min="1" max="5" defaultValue={hotelToEdit.stars} required className="rounded-md bg-background" /></div>
              <div className="space-y-1.5"><Label>Cover URL</Label><Input name="imageUrl" type="url" defaultValue={hotelToEdit.imageUrl || ''} className="rounded-md bg-background" /></div>
              <Button type="submit" className="w-full mt-6 rounded-md font-bold cursor-pointer" disabled={isUpdating}>{isUpdating ? "Mutating data..." : "Save Changes"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}