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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterBookingId, setFilterBookingId] = useState("");
  const [filterEmail, setFilterEmail] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

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
        if (filterEmail.trim() !== "") loadedReservations = loadedReservations.filter((r: Reservation) => r.userEmail?.toLowerCase().includes(filterEmail.toLowerCase()));
        setReservations(loadedReservations);
        setTotalPages(resData.data.totalPages || 1);
        setTotalElements(resData.data.totalElements || loadedReservations.length);
      }
      setRooms(roomsData.data?.content || []);
    } catch (err) { setError("Failed to synchronize reservation ledgers."); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(currentPage), 300);
    return () => clearTimeout(timer);
  }, [currentPage, filterStatus, filterBookingId, filterEmail]);

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

  const handleModalCloseChange = (open: boolean) => {
    setIsCreateModalOpen(open);
    if (!open) { setSelectedUser(null); setUserSearchQuery(""); setUserSearchResults([]); setSelectedRoomId(""); }
  };

  const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) { alert("Please select a guest identity."); return; }
    setIsCreating(true); const formData = new FormData(e.currentTarget);
    try {
      await api.post("/reservations", { userId: selectedUser.id, roomId: Number(selectedRoomId), checkInDate: formData.get("checkInDate"), checkOutDate: formData.get("checkOutDate"), numberOfGuests: Number(formData.get("numberOfGuests")) });
      handleModalCloseChange(false); fetchData(currentPage);
    } catch (err) { alert("Failed to confirm booking."); } finally { setIsCreating(false); }
  };

  const handleUpdateStatus = async (reservationId: number, newStatus: string) => {
    try { await api.put(`/reservations/${reservationId}/status`, { status: newStatus }); fetchData(currentPage); } 
    catch (err) { alert(`Failed to mark reservation as ${newStatus}. Note: Backend must support /reservations/{id}/status endpoint.`); }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if(!window.confirm("Terminate this reservation? This releases the room instantly.")) return;
    try { await api.put(`/reservations/${reservationId}/cancel`); fetchData(currentPage); } catch (err) { alert("Failed to cancel reservation."); }
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6 gap-4">
        <div><h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><CalendarCheck className="w-8 h-8 text-primary" /> Reservations Ledger</h1><p className="text-muted-foreground font-medium text-sm mt-1">Audit global upcoming and past booking operations.</p></div>
        <div className="flex items-center gap-3">
          {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && (
            <Dialog open={isCreateModalOpen} onOpenChange={handleModalCloseChange}>
              <DialogTrigger asChild><Button className="flex items-center gap-2 font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"><Plus className="w-4 h-4" /> Book Suite</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[550px] border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader><DialogTitle className="text-2xl font-black tracking-tight">Generate Reservation</DialogTitle><DialogDescription>Open a verified ledger window linked against live system assets.</DialogDescription></DialogHeader>
                <form onSubmit={handleCreateReservation} className="space-y-5 mt-4">
                  <div className="space-y-2 relative">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Guest Clearance Search</Label>
                    {!selectedUser ? (
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Type customer name..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="pl-10 bg-background/50 border-border/50 h-11 text-sm shadow-inner" required={!selectedUser} />
                        {userSearchQuery.trim().length >= 2 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-md z-50 divide-y divide-border/30">
                            {isSearchingUsers ? <div className="p-4 text-xs font-bold text-muted-foreground text-center animate-pulse">Scanning repository...</div> : userSearchResults.length === 0 ? <div className="p-4 text-xs font-bold text-muted-foreground text-center">No identities discovered.</div> : userSearchResults.map((u) => (
                                <div key={u.id} onClick={() => setSelectedUser(u)} className="p-3 hover:bg-accent/50 flex items-center justify-between cursor-pointer text-sm transition-colors group"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center uppercase">{u.firstName.charAt(0)}{u.lastName?.charAt(0) || ""}</div><div><p className="font-bold text-foreground">{u.firstName} {u.lastName}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></div><Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-background/40 border border-border/50 rounded-md flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-md bg-primary text-primary-foreground font-black flex items-center justify-center uppercase shadow-md">{selectedUser.firstName.charAt(0)}{selectedUser.lastName?.charAt(0) || ""}</div><div><p className="font-black text-foreground text-base">{selectedUser.firstName} {selectedUser.lastName}</p><p className="text-xs font-medium text-muted-foreground">{selectedUser.email}</p></div></div><Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedUser(null); setUserSearchQuery(""); }} className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"><X className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Suite Mapping</Label>
                    <Select onValueChange={setSelectedRoomId} value={selectedRoomId} required>
                      <SelectTrigger className="bg-background/50 border-border/50 h-11 cursor-pointer"><SelectValue placeholder="Link room asset..." /></SelectTrigger>
                      <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">{rooms.map(r => <SelectItem key={r.id} value={r.id.toString()} className="cursor-pointer">Room {r.roomNumber} &rarr; {r.hotelName} ({r.roomType})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="checkInDate" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-in</Label><Input id="checkInDate" name="checkInDate" type="date" required className="bg-background/50 border-border/50 h-11 shadow-inner" /></div>
                    <div className="space-y-2"><Label htmlFor="checkOutDate" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Check-out</Label><Input id="checkOutDate" name="checkOutDate" type="date" required className="bg-background/50 border-border/50 h-11 shadow-inner" /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="numberOfGuests" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Number of Guests</Label><Input id="numberOfGuests" name="numberOfGuests" type="number" min={1} required className="bg-background/50 border-border/50 h-11 shadow-inner" /></div>
                  <Button type="submit" className="w-full mt-6 h-12 text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer" disabled={isCreating}>{isCreating ? "Processing Ledger..." : "Confirm Secure Booking"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md bg-card/40 backdrop-blur-md border border-border/50 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/10">
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-primary" /> Booking ID</Label><Input placeholder="e.g. BK-15..." value={filterBookingId} onChange={(e) => { setFilterEmail(""); setFilterBookingId(e.target.value); setCurrentPage(0); }} className="bg-background/50 border-border/50 text-sm h-10 shadow-inner hover:border-primary/50 transition-colors" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-chart-2" /> Guest Email</Label><Input placeholder="e.g. vip@customer.com..." value={filterEmail} onChange={(e) => { setFilterBookingId(""); setFilterEmail(e.target.value); setCurrentPage(0); }} className="bg-background/50 border-border/50 text-sm h-10 shadow-inner hover:border-primary/50 transition-colors" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-chart-3" /> Status</Label><Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}><SelectTrigger className="bg-background/50 border-border/50 text-sm h-10 cursor-pointer hover:border-primary/50 transition-colors"><SelectValue /></SelectTrigger><SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl"><SelectItem value="ALL" className="cursor-pointer">All Bookings</SelectItem><SelectItem value="CONFIRMED" className="cursor-pointer">Confirmed</SelectItem><SelectItem value="PENDING" className="cursor-pointer">Pending</SelectItem><SelectItem value="COMPLETED" className="cursor-pointer">Completed</SelectItem><SelectItem value="CANCELLED" className="cursor-pointer">Cancelled</SelectItem></SelectContent></Select></div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Synchronizing ledgers...</div>
      ) : error ? (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex-1">{error}</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-card/40 backdrop-blur-md border rounded-md shadow-sm overflow-hidden border-border/50 dark:ring-1 dark:ring-white/10">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
                <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Ledger ID</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Guest Identity</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Branch Asset</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Stay Window</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Financials</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {reservations.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center font-medium text-muted-foreground">No bookings matched your audit parameters.</td></tr> : (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-accent/20 hover:shadow-sm transition-all group">
                      <td className="px-6 py-4 font-mono text-xs font-black text-muted-foreground">BK-{res.id}</td>
                      <td className="px-6 py-4"><p className="font-black text-foreground group-hover:text-primary transition-colors">{res.userFirstName} {res.userLastName}</p><p className="text-[10px] font-bold text-muted-foreground">{res.userEmail}</p></td>
                      <td className="px-6 py-4"><p className="font-bold text-foreground">{res.hotelName}</p><p className="text-[10px] font-bold text-muted-foreground">Room {res.roomNumber} ({res.roomType})</p></td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2 text-muted-foreground font-medium"><Calendar className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" /><span>{res.checkInDate} <span className="mx-1">&rarr;</span> {res.checkOutDate}</span></div></td>
                      <td className="px-6 py-4 font-black text-primary">${res.totalPrice}</td>
                      <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm ${res.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : res.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive border-destructive/20' : res.status === 'COMPLETED' ? 'bg-chart-2/10 text-chart-2 border-chart-2/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{res.status}</span></td>
                      <td className="px-6 py-4 text-right">
                        {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && res.status !== 'CANCELLED' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50 hover:shadow-md transition-all cursor-pointer"><MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl p-1">
                              <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Mutate Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(res.id, 'CONFIRMED')} className="font-bold cursor-pointer text-emerald-500 hover:bg-emerald-500/10 transition-colors"><ShieldCheck className="mr-2 h-4 w-4" /> Mark Confirmed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(res.id, 'COMPLETED')} className="font-bold cursor-pointer text-chart-2 hover:bg-chart-2/10 transition-colors"><CalendarCheck className="mr-2 h-4 w-4" /> Mark Completed</DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCancelReservation(res.id)} className="text-destructive focus:text-destructive cursor-pointer font-bold hover:bg-destructive/10 transition-colors"><Ban className="mr-2 h-4 w-4" /> Terminate</DropdownMenuItem>
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
          <div className="flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-md border rounded-md shadow-sm border-border/50 mt-auto dark:ring-1 dark:ring-white/10"><span className="text-sm text-muted-foreground font-medium">Page <span className="font-black text-foreground">{currentPage + 1}</span> of <span className="font-black text-foreground">{totalPages}</span> ({totalElements} global records)</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="font-bold hover:bg-accent/50 cursor-pointer"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="font-bold hover:bg-accent/50 cursor-pointer">Next <ChevronRight className="w-4 h-4 ml-1" /></Button></div></div>
        </div>
      )}
    </div>
  );
}