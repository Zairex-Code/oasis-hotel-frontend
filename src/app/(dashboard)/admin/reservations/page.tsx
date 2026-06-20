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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, MoreHorizontal, Ban, ChevronLeft, ChevronRight, Filter, CalendarCheck, Bed, Search, X, Check, Hash, Mail, ShieldCheck } from "lucide-react";
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

  /**
   * Parallel API Promise Resolution
   * Fetches the paginated reservations list and available rooms simultaneously
   * to optimize Time-To-Interactive (TTI).
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
        // Client-side fallback filtering for rapid UI response
        if (filterStatus !== "ALL") loadedReservations = loadedReservations.filter((r: Reservation) => r.status === filterStatus);
        if (filterBookingId.trim() !== "") {
            const numericId = filterBookingId.replace(/\D/g, '');
            loadedReservations = loadedReservations.filter((r: Reservation) => r.id.toString() === numericId);
        }
        setReservations(loadedReservations); setTotalPages(resData.data.totalPages || 1);
      }
      setRooms(roomsData.data?.content || []);
    } catch (err) { console.error("Sync fault"); } finally { setIsLoading(false); }
  };

  useEffect(() => { const timer = setTimeout(() => fetchData(currentPage), 300); return () => clearTimeout(timer); }, [currentPage, filterStatus, filterBookingId, filterEmail]);

  // Debounced Identity Lookup
  useEffect(() => {
    if (userSearchQuery.trim().length < 2) { setUserSearchResults([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      try { setIsSearchingUsers(true); const response = await api.get(`/users/search/name?name=${encodeURIComponent(userSearchQuery)}`); setUserSearchResults(response.data.content || response.data || []); } finally { setIsSearchingUsers(false); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  /**
   * Commits a new Ledger Entry.
   */
  const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!selectedUser) return; setIsCreating(true); const formData = new FormData(e.currentTarget);
    try { await api.post("/reservations", { userId: selectedUser.id, roomId: Number(selectedRoomId), checkInDate: formData.get("checkInDate"), checkOutDate: formData.get("checkOutDate"), numberOfGuests: Number(formData.get("numberOfGuests")) }); setIsCreateModalOpen(false); fetchData(currentPage); } finally { setIsCreating(false); }
  };

  /**
   * Mutates the Lifecycle state of a specific booking.
   */
  const handleUpdateStatus = async (reservationId: number, newStatus: string) => {
    try { await api.put(`/reservations/${reservationId}/status`, { status: newStatus }); fetchData(currentPage); } catch (err) { alert("Failed to mark."); }
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6 gap-4">
        <div><h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><CalendarCheck className="w-8 h-8 text-primary" /> Reservations Ledger</h1><p className="text-muted-foreground font-medium text-sm mt-1">Audit global upcoming and past booking operations.</p></div>
        <div className="flex items-center gap-3">
          {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild><Button className="flex items-center gap-2 font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"><Plus className="w-4 h-4" /> Book Suite</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[550px] border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader><DialogTitle className="text-2xl font-black tracking-tight">Generate Reservation</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateReservation} className="space-y-5 mt-4">
                  <div className="space-y-2 relative"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Guest Clearance Search</Label>
                    {!selectedUser ? (
                      <div className="relative"><Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Type customer name..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="pl-10 bg-background/50 border-border/50 h-11 text-sm shadow-inner" required={!selectedUser} />
                        {userSearchQuery.trim().length >= 2 && (<div className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-md z-50 divide-y divide-border/30">{isSearchingUsers ? <div className="p-4 text-center">Scanning...</div> : userSearchResults.map((u) => (<div key={u.id} onClick={() => setSelectedUser(u)} className="p-3 hover:bg-accent/50 flex items-center justify-between cursor-pointer">{u.firstName}</div>))}</div>)}
                      </div>
                    ) : (
                      <div className="p-4 bg-background/40 border border-border/50 rounded-md flex items-center justify-between shadow-sm animate-in fade-in duration-200"><p className="font-black text-foreground text-base">{selectedUser.firstName} {selectedUser.lastName}</p><Button type="button" variant="ghost" onClick={() => setSelectedUser(null)} className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"><X className="w-4 h-4" /></Button></div>
                    )}
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Target Suite Mapping</Label><Select onValueChange={setSelectedRoomId} value={selectedRoomId} required><SelectTrigger className="bg-background/50 border-border/50 h-11 cursor-pointer"><SelectValue placeholder="Link room asset..." /></SelectTrigger><SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">{rooms.map(r => <SelectItem key={r.id} value={r.id.toString()} className="cursor-pointer">Room {r.roomNumber}</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="checkInDate" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-in</Label><Input name="checkInDate" type="date" required className="bg-background/50 border-border/50 h-11 shadow-inner" /></div><div className="space-y-2"><Label htmlFor="checkOutDate" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-out</Label><Input name="checkOutDate" type="date" required className="bg-background/50 border-border/50 h-11 shadow-inner" /></div></div>
                  <Button type="submit" className="w-full mt-6 h-12 text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" disabled={isCreating}>{isCreating ? "Processing Ledger..." : "Confirm Secure Booking"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Synchronizing ledgers...</div> : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-card/40 backdrop-blur-md border rounded-md shadow-sm overflow-hidden border-border/50 dark:ring-1 dark:ring-white/10">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
                <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Ledger ID</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-accent/20 hover:shadow-sm transition-all group">
                      <td className="px-6 py-4 font-mono text-xs font-black text-muted-foreground">BK-{res.id}</td>
                      <td className="px-6 py-4"><span className="inline-flex px-2.5 py-1 rounded-md text-[9px] font-black uppercase border shadow-sm">{res.status}</span></td>
                      <td className="px-6 py-4 text-right">
                        {currentUser?.role === 'ADMIN' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50 hover:shadow-md transition-all cursor-pointer"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl p-1">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(res.id, 'CONFIRMED')} className="font-bold cursor-pointer text-emerald-500 hover:bg-emerald-500/10"><ShieldCheck className="mr-2 h-4 w-4" /> Mark Confirmed</DropdownMenuItem>
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
      )}
    </div>
  );
}