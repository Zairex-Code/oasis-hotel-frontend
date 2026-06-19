"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Star, Image as ImageIcon, MoreVertical, Edit, Power, ChevronLeft, ChevronRight, Search, Building2 } from "lucide-react";

export default function HotelsPage() {
  const { user } = useAuth();
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hotelToEdit, setHotelToEdit] = useState<Hotel | null>(null); 

  // Pagination coordinates
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // 🚀 INTERACTIVE FILTER INPUT STATES
  const [filterName, setFilterName] = useState("");
  const [filterCity, setFilterCity] = useState("");

  // Sync with Spring Boot endpoints based on active filters
  const fetchHotels = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = `/hotels?page=${pageToFetch}`;
      
      // 🚀 ADVANCED ROUTING: Switch endpoints if the user is typing in the filter boxes
      if (filterName.trim() !== "") {
        endpoint = `/hotels/search/name?name=${encodeURIComponent(filterName)}&page=${pageToFetch}`;
      } else if (filterCity.trim() !== "") {
        endpoint = `/hotels/search/city?city=${encodeURIComponent(filterCity)}&page=${pageToFetch}`;
      }

      const response = await api.get(endpoint); 
      
      if (response.data) {
        if (response.data.content && Array.isArray(response.data.content)) {
          setHotels(response.data.content);
          setTotalPages(response.data.totalPages || 1);
          setTotalElements(response.data.totalElements || response.data.content.length);
        }
      }
    } catch (err: any) {
      console.error("Query synchronization failure:", err);
      setError("Failed to resolve search parameters against database indexes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch automatically when page or filters change
  useEffect(() => {
    // Adding a small debounce logic could be done here, but for now strict effect dependency works
    const timer = setTimeout(() => {
        fetchHotels(currentPage);
    }, 300); // 300ms debounce to avoid spamming the backend while typing
    return () => clearTimeout(timer);
  }, [currentPage, filterName, filterCity]);

  // MUTATIONS (Create / Update / Status)
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

  const handleToggleStatus = async (hotelId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/hotels/${hotelId}/status`, { status: newStatus });
      fetchHotels(currentPage);
    } catch (err) { alert("Status mutation failure."); }
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <Building2 className="w-8 h-8 text-primary" /> Ecosystem Branches
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Audit, structure, and filter global hotel infrastructure footprints.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 rounded-xl font-bold shadow-md shadow-primary/20">
                <Plus className="w-4 h-4" /> Add New Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register New Branch</DialogTitle>
                <DialogDescription>Fill out the profile metrics to inject a new branch entity.</DialogDescription>
              </DialogHeader>
              <form action={handleCreateHotel} className="space-y-4 mt-4">
                <div className="space-y-1.5"><Label>Hotel Name</Label><Input name="name" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Target City</Label><Input name="city" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Full Address</Label><Input name="address" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Stars (1-5)</Label><Input name="stars" type="number" min="1" max="5" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Cover URL</Label><Input name="imageUrl" type="url" className="rounded-xl" /></div>
                <Button type="submit" className="w-full mt-6 rounded-xl font-bold" disabled={isCreating}>{isCreating ? "Saving entry..." : "Save Hotel branch"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 🚀 THE INTERACTIVE FILTER CONTROLLER TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="space-y-2">
          <Label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><Search className="w-3.5 h-3.5 text-primary" /> Search by Name</Label>
          <Input 
            placeholder="e.g. Oasis Premium Resort..." 
            value={filterName} 
            onChange={(e) => { setFilterCity(""); setFilterName(e.target.value); setCurrentPage(0); }} 
            className="rounded-xl bg-background border-border shadow-inner text-sm h-11" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><MapPin className="w-3.5 h-3.5 text-chart-2" /> Lookup by City</Label>
          <Input 
            placeholder="e.g. Miami..." 
            value={filterCity} 
            onChange={(e) => { setFilterName(""); setFilterCity(e.target.value); setCurrentPage(0); }} 
            className="rounded-xl bg-background border-border shadow-inner text-sm h-11" 
          />
        </div>
      </div>

      {/* RENDER LISTINGS BLOCK */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Querying database registers...</div>
      ) : error ? (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex-1">{error}</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col justify-between group">
                <div className="relative w-full h-48 bg-muted overflow-hidden">
                  {hotel.imageUrl ? (
                    <img src={hotel.imageUrl} alt={hotel.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground/30"><ImageIcon className="w-10 h-10" /></div>
                  )}
                  <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black shadow-lg tracking-wide ${
                      hotel.status === 'ACTIVE' ? 'bg-emerald-500/90 text-white backdrop-blur-sm' : 'bg-destructive/90 text-white backdrop-blur-sm'
                  }`}>
                    {hotel.status}
                  </span>
                </div>
                
                <CardHeader className="pb-2 relative z-10 bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-black truncate max-w-[200px]">{hotel.name}</CardTitle>
                      <div className="flex items-center mt-1.5 space-x-0.5 text-yellow-500">
                        {Array.from({ length: Number(hotel.stars) || 0 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                      </div>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-xl"><MoreVertical className="h-5 w-5 text-muted-foreground" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border border-border bg-card shadow-xl">
                          <DropdownMenuLabel className="font-black">Actions Scope</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setHotelToEdit(hotel); setIsEditModalOpen(true); }} className="rounded-lg font-medium cursor-pointer"><Edit className="mr-2 h-4 w-4 text-primary" /> Edit Parameters</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(hotel.id, hotel.status)} className={`rounded-lg font-bold cursor-pointer ${hotel.status === 'ACTIVE' ? "text-destructive" : "text-emerald-500"}`}><Power className="mr-2 h-4 w-4" /> {hotel.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="mt-2 p-6 pt-0 bg-card">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground font-medium">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span className="line-clamp-2">{hotel.address}, <span className="font-bold text-foreground">{hotel.city}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {hotels.length === 0 && <p className="py-16 text-center border-2 border-dashed rounded-2xl col-span-full font-bold text-muted-foreground bg-card border-border/50">No hotel branch configurations found matching criteria.</p>}
          </div>

          {/* PAGINATION FOOTER */}
          <div className="flex items-center justify-between px-6 py-4 bg-card border rounded-2xl shadow-sm border-border mt-auto">
            <span className="text-sm text-muted-foreground font-medium">
              Showing page <span className="font-black text-foreground">{currentPage + 1}</span> of <span className="font-black text-foreground">{totalPages}</span> ({totalElements} matched entries)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="rounded-xl font-bold border-border hover:bg-accent"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="rounded-xl font-bold border-border hover:bg-accent">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Hotel Metrics</DialogTitle></DialogHeader>
          {hotelToEdit && (
            <form action={handleUpdateHotel} className="space-y-4 mt-4">
              <div className="space-y-1.5"><Label>Hotel Name</Label><Input name="name" defaultValue={hotelToEdit.name} required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>City</Label><Input name="city" defaultValue={hotelToEdit.city} required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Address</Label><Input name="address" defaultValue={hotelToEdit.address} required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Stars (1-5)</Label><Input name="stars" type="number" min="1" max="5" defaultValue={hotelToEdit.stars} required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Cover URL</Label><Input name="imageUrl" type="url" defaultValue={hotelToEdit.imageUrl || ''} className="rounded-xl" /></div>
              <Button type="submit" className="w-full mt-6 rounded-xl font-bold" disabled={isUpdating}>{isUpdating ? "Mutating data..." : "Save Changes"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}