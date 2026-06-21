/**
 * @file page.tsx (Global Reservations Ledger)
 * @description Master control panel for tracking, auditing, and mutating reservation lifecycles.
 * Aggregates global data across all branches. Supports cross-domain relational operations 
 * (Assigning Users to Rooms via asynchronous lookup schemas).
 */

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Reservation, Room, User } from "@/types";
import { useAuth } from "@/context/AuthContext";

// 🚀 IMPORTAMOS EL MOTOR DE ALERTAS PREMIUM
import { Alerts } from "@/lib/alerts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, MoreHorizontal, Ban, ChevronLeft, ChevronRight, Filter, CalendarCheck, Bed, Search, X, Check, Hash, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReservationsPage() {
  const { user: currentUser } = useAuth();
  
  // Ledger Core States
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Modals & Search Engines
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Audit Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterBookingId, setFilterBookingId] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  /**
   * Parallel API Promise Resolution
   */
  const fetchData = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true);
      const [resData, roomsData] = await Promise.all([
        api.get(`/reservations?page=${pageToFetch}`),
        api.get("/rooms?size=100") 
      ]);

      if (resData.data?.content) {
        let loadedReservations = resData.data.content;
        if (filterStatus !== "ALL") loadedReservations = loadedReservations.filter((r: Reservation) => r.status === filterStatus);
        if (filterBookingId.trim() !== "") {
            const numericId = filterBookingId.replace(/\D/g, '');
            loadedReservations = loadedReservations.filter((r: Reservation) => r.id.toString() === numericId);
        }
        if (filterEmail.trim() !== "") {
            loadedReservations = loadedReservations.filter((r: Reservation) => r.userEmail?.toLowerCase().includes(filterEmail.toLowerCase()));
        }
        setReservations(loadedReservations); 
        setTotalPages(resData.data.totalPages || 1);
        setTotalElements(resData.data.totalElements || loadedReservations.length);
      }
      setRooms(roomsData.data?.content || []);
    } catch (err) { 
      console.error("Sync fault"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { const timer = setTimeout(() => fetchData(currentPage), 300); return () => clearTimeout(timer); }, [currentPage, filterStatus, filterBookingId, filterEmail]);

  // Debounced Identity Lookup
  useEffect(() => {
    if (userSearchQuery.trim().length < 2) { setUserSearchResults([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      try { 
        setIsSearchingUsers(true); 
        const response = await api.get(`/users/search/name?name=${encodeURIComponent(userSearchQuery)}`); 
        setUserSearchResults(response.data.content || response.data || []); 
      } finally { 
        setIsSearchingUsers(false); 
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  /**
   * 🚀 Commits a new Ledger Entry with SweetAlert2.
   */
  const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    if (!selectedUser) { 
      Alerts.error("Missing Identity", "Select a guest identity first to bind the ledger.");
      return; 
    } 
    setIsCreating(true); 
    const formData = new FormData(e.currentTarget);
    try { 
      await api.post("/reservations", { 
        userId: selectedUser.id, 
        roomId: Number(selectedRoomId), 
        checkInDate: formData.get("checkInDate"), 
        checkOutDate: formData.get("checkOutDate"), 
        numberOfGuests: Number(formData.get("numberOfGuests")) 
      }); 
      
      setIsCreateModalOpen(false); 
      setSelectedUser(null);
      setUserSearchQuery("");
      fetchData(currentPage); 
      Alerts.success("Booking Confirmed", "The ledger window has been successfully assigned.");
    } catch (err) {
      Alerts.error("Transaction Failed", "The room might be unavailable for those dates.");
    } finally { 
      setIsCreating(false); 
    }
  };

  /**
   * 🚀 Mutates the Lifecycle state of a specific booking with SweetAlert Confirmations.
   */
  const handleUpdateStatus = async (reservationId: number, newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      const isConfirmed = await Alerts.confirm(
        "Terminate Ledger?", 
        "Are you sure you want to cancel this booking? This action releases the room asset immediately.",
        "Yes, Terminate"
      );
      if (!isConfirmed) return;
    }

    try { 
      await api.put(`/reservations/${reservationId}/status`, { status: newStatus }); 
      fetchData(currentPage); 
      Alerts.toast(`Status updated to ${newStatus}`);
    } catch (err) { 
      Alerts.error("Mutation Failed", "Failed to modify ledger status."); 
    }
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-primary" /> Reservations Ledger
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Audit global upcoming and past booking operations.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && (
            <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if(!open) { setSelectedUser(null); setUserSearchQuery(""); } }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer h-10 px-5">
                  <Plus className="w-4 h-4" /> Book Suite
                </Button>
              </DialogTrigger>
              
              {/* 🚀 MODAL ULTRA-PREMIUM (El mismo diseño elegante de Habitaciones) */}
              <DialogContent className="sm:max-w-[550px] md:max-w-[650px] border-border/40 bg-card/95 backdrop-blur-2xl p-8 shadow-2xl rounded-md ring-1 ring-black/10 dark:ring-white/10 animate-in zoom-in-95 duration-200">
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <CalendarCheck className="w-8 h-8 text-primary"/> Secure Reservation
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-1 font-medium text-muted-foreground">
                    Open a verified ledger window linked against live system assets.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateReservation} className="space-y-6 mt-6">
                  
                  {/* GUEST SEARCH ENGINE */}
                  <div className="space-y-2 relative z-50">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Target Guest Identity</Label>
                    
                    {!selectedUser ? (
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="Type guest first or last name to index database..." 
                          value={userSearchQuery} 
                          onChange={(e) => setUserSearchQuery(e.target.value)} 
                          className="pl-11 h-12 bg-background/50 border-border/60 shadow-inner font-medium text-sm transition-all focus:ring-primary/50" 
                          required={!selectedUser} 
                        />
                        {userSearchQuery.trim().length >= 2 && (
                          <div className="absolute left-0 right-0 top-full mt-2 max-h-56 overflow-y-auto bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-md divide-y divide-border/30">
                            {isSearchingUsers ? (
                              <div className="p-4 text-xs font-bold text-primary text-center animate-pulse">Scanning identity network...</div>
                            ) : userSearchResults.length === 0 ? (
                              <div className="p-4 text-xs font-bold text-muted-foreground text-center">No identities discovered.</div>
                            ) : (
                              userSearchResults.map((u) => (
                                <div key={u.id} onClick={() => setSelectedUser(u)} className="p-3.5 hover:bg-primary/10 flex items-center justify-between cursor-pointer transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-md bg-background border border-border text-foreground font-black text-xs flex items-center justify-center uppercase shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                      {u.firstName.charAt(0)}{u.lastName?.charAt(0) || ""}
                                    </div>
                                    <div>
                                      <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{u.firstName} {u.lastName}</p>
                                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{u.email}</p>
                                    </div>
                                  </div>
                                  <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 🚀 TARJETA HERO DEL USUARIO SELECCIONADO */
                      <div className="p-5 bg-gradient-to-br from-primary/10 via-background/40 to-background border border-primary/20 rounded-md flex items-center justify-between shadow-sm ring-1 ring-black/5 dark:ring-white/5 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground font-black flex items-center justify-center text-lg shadow-xl ring-2 ring-background">
                            {selectedUser.firstName.charAt(0)}{selectedUser.lastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <p className="font-black text-foreground text-lg leading-tight">{selectedUser.firstName} {selectedUser.lastName}</p>
                            <p className="text-[10px] font-bold text-primary tracking-widest uppercase mt-0.5">{selectedUser.email}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedUser(null); setUserSearchQuery(""); }} className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-md transition-all">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Bed className="w-3.5 h-3.5" /> Target Suite Mapping</Label>
                    <Select onValueChange={setSelectedRoomId} value={selectedRoomId} required>
                      <SelectTrigger className="bg-background/50 border-border/60 h-12 cursor-pointer shadow-inner"><SelectValue placeholder="Link room asset..." /></SelectTrigger>
                      <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                        {rooms.map(r => <SelectItem key={r.id} value={r.id.toString()} className="cursor-pointer font-bold">Unit {r.roomNumber} &mdash; {r.hotelName} ({r.roomType})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-in Stay Window</Label><Input name="checkInDate" type="date" required className="bg-background h-12 shadow-inner" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-out Settlement</Label><Input name="checkOutDate" type="date" required className="bg-background h-12 shadow-inner" /></div>
                  </div>
                  
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Number of Active Guests</Label><Input name="numberOfGuests" type="number" min={1} required className="bg-background h-12 shadow-inner" placeholder="E.g. 2 guests" /></div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t border-border/40 mt-8">
                    <Button type="button" variant="ghost" className="rounded-md font-bold h-12 px-6 cursor-pointer" onClick={() => setIsCreateModalOpen(false)}>Cancel Window</Button>
                    <Button type="submit" className="rounded-md font-bold cursor-pointer shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all h-12 px-8 bg-primary text-primary-foreground text-sm" disabled={isCreating}>{isCreating ? "Validating Ledger Token..." : "Lock Secure Booking"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md bg-card/40 backdrop-blur-md border border-border/50 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/10">
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-primary" /> Booking ID</Label><Input placeholder="e.g. BK-15..." value={filterBookingId} onChange={(e) => { setFilterEmail(""); setFilterBookingId(e.target.value); setCurrentPage(0); }} className="bg-background/50 border-border/50 text-sm h-10 shadow-inner hover:border-primary/50 transition-colors" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-chart-2" /> Guest Email</Label><Input placeholder="e.g. vip@customer.com..." value={filterEmail} onChange={(e) => { setFilterBookingId(""); setFilterEmail(e.target.value); setCurrentPage(0); }} className="bg-background/50 border-border/50 text-sm h-10 shadow-inner hover:border-primary/50 transition-colors" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-chart-3" /> Status</Label><Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}><SelectTrigger className="bg-background/50 border-border/50 text-sm h-10 cursor-pointer hover:border-primary/50 transition-colors"><SelectValue /></SelectTrigger><SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl"><SelectItem value="ALL" className="cursor-pointer">All Bookings</SelectItem><SelectItem value="CONFIRMED" className="cursor-pointer">Confirmed</SelectItem><SelectItem value="PENDING" className="cursor-pointer">Pending</SelectItem><SelectItem value="COMPLETED" className="cursor-pointer">Completed</SelectItem><SelectItem value="CANCELLED" className="cursor-pointer">Cancelled</SelectItem></SelectContent></Select></div>
      </div>

      {/* 🚀 RESERVATIONS GRID (FULL COLUMNS RESTORED) */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Synchronizing global ledgers...</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-card/40 backdrop-blur-md border rounded-md shadow-sm overflow-hidden border-border/50 dark:ring-1 dark:ring-white/10">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Ledger ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Guest Identity</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Branch Asset</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Stay Window</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Financials</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {reservations.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center font-medium text-muted-foreground">No bookings matched your audit parameters.</td></tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-accent/20 hover:shadow-sm transition-all group">
                      
                      {/* ID */}
                      <td className="px-6 py-4 font-mono text-xs font-black text-muted-foreground">BK-{res.id}</td>
                      
                      {/* GUEST INFO WITH AVATAR */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary font-black text-[10px] flex items-center justify-center uppercase border border-primary/20 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {res.userFirstName?.charAt(0)}{res.userLastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-tight">{res.userFirstName} {res.userLastName}</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{res.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* HOTEL & ROOM INFO */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm leading-tight">{res.hotelName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5 flex items-center gap-1"><Bed className="w-3 h-3 text-primary" /> Unit {res.roomNumber} &mdash; {res.roomType}</p>
                      </td>
                      
                      {/* DATES */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs bg-background/50 px-2.5 py-1.5 rounded-md border border-border/40 shadow-inner w-fit">
                          <Calendar className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                          <span>{res.checkInDate} <span className="mx-1 text-border">&rarr;</span> {res.checkOutDate}</span>
                        </div>
                      </td>
                      
                      {/* PRICE */}
                      <td className="px-6 py-4 font-black text-primary text-sm">${res.totalPrice}</td>
                      
                      {/* STATUS BADGE */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm ${res.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : res.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive border-destructive/20' : res.status === 'COMPLETED' ? 'bg-chart-2/10 text-chart-2 border-chart-2/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                          {res.status}
                        </span>
                      </td>
                      
                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right">
                        {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && res.status !== 'CANCELLED' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50 hover:shadow-md transition-all cursor-pointer rounded-md">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl p-1 rounded-md">
                              <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Mutate Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(res.id, 'CONFIRMED')} className="font-bold cursor-pointer text-emerald-500 hover:bg-emerald-500/10 transition-colors rounded-sm"><ShieldCheck className="mr-2 h-4 w-4" /> Mark Confirmed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(res.id, 'COMPLETED')} className="font-bold cursor-pointer text-chart-2 hover:bg-chart-2/10 transition-colors rounded-sm"><CalendarCheck className="mr-2 h-4 w-4" /> Mark Completed</DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateStatus(res.id, 'CANCELLED')} className="text-destructive focus:text-destructive cursor-pointer font-bold hover:bg-destructive/10 transition-colors rounded-sm"><Ban className="mr-2 h-4 w-4" /> Terminate</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-md border rounded-md shadow-sm border-border/50 mt-auto dark:ring-1 dark:ring-white/10">
            <span className="text-sm text-muted-foreground font-medium">Page <span className="font-black text-foreground">{currentPage + 1}</span> of <span className="font-black text-foreground">{totalPages}</span> ({totalElements} global records)</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="font-bold hover:bg-accent/50 cursor-pointer rounded-md"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="font-bold hover:bg-accent/50 cursor-pointer rounded-md">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}