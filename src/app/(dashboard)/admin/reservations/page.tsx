"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Reservation, Room, User } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, MoreHorizontal, Ban, ChevronLeft, ChevronRight, Filter, CalendarCheck, User as UserIcon, Bed, Search, X, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReservationsPage() {
  const { user: currentUser } = useAuth();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Control States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // 🚀 ASYNCHRONOUS GUEST SEARCH STATES (Enterprise Autocomplete Pattern)
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form selections
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Pagination states
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Fetch reservations ledger & room catalog list
  const fetchData = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [resData, roomsData] = await Promise.all([
        api.get(`/reservations?page=${pageToFetch}`),
        api.get("/rooms?size=100") // To populate room configurations
      ]);

      if (resData.data?.content) {
        let loadedReservations = resData.data.content;
        if (filterStatus !== "ALL") {
            loadedReservations = loadedReservations.filter((r: Reservation) => r.status === filterStatus);
        }
        setReservations(loadedReservations);
        setTotalPages(resData.data.totalPages || 1);
        setTotalElements(resData.data.totalElements || loadedReservations.length);
      }
      setRooms(roomsData.data?.content || []);
    } catch (err: any) {
      console.error("Error fetching reservation data:", err);
      setError("Failed to synchronize reservation ledgers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, filterStatus]);

  // 🚀 LIVE USER DEBOUNCED SEARCH SYNCED WITH JAVA ENDPOINT
  useEffect(() => {
    if (userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const response = await api.get(`/users/search/name?name=${encodeURIComponent(userSearchQuery)}`);
        
        if (response.data?.content) {
          setUserSearchResults(response.data.content);
        } else if (Array.isArray(response.data)) {
          setUserSearchResults(response.data);
        }
      } catch (err) {
        console.error("User database index lookup failure:", err);
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300); // 300ms throttle boundary

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  // RESET CONTROL ON MODAL CLOSURE
  const handleModalCloseChange = (open: boolean) => {
    setIsCreateModalOpen(open);
    if (!open) {
      setSelectedUser(null);
      setUserSearchQuery("");
      setUserSearchResults([]);
      setSelectedRoomId("");
    }
  };

  const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) {
      alert("Please search and select a valid network guest profile.");
      return;
    }

    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const payload = {
        userId: selectedUser.id,
        roomId: Number(selectedRoomId),
        checkInDate: formData.get("checkInDate"),
        checkOutDate: formData.get("checkOutDate"),
        numberOfGuests: Number(formData.get("numberOfGuests"))
      };

      await api.post("/reservations", payload);
      handleModalCloseChange(false);
      fetchData(currentPage);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, msg]) => `• ${field}: ${msg}`).join("\n");
        alert(`Validation Failed:\n${errorMessages}`);
      } else {
        alert(err.response?.data?.detail || "Could not process reservation.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if(!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await api.put(`/reservations/${reservationId}/cancel`);
      fetchData(currentPage);
    } catch (err: any) {
      alert("Failed to cancel reservation.");
    }
  };

  // 🚀 MISSING FUNCTIONS RESTORED HERE:
  const handlePreviousPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };
  const handleNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1); };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <CalendarCheck className="w-8 h-8 text-primary" /> Reservations Ledger
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Audit global upcoming and past booking operations.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(0); }}>
            <SelectTrigger className="w-[180px] rounded-xl bg-card border-border font-medium shadow-sm">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="ALL">All Bookings</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && (
            <Dialog open={isCreateModalOpen} onOpenChange={handleModalCloseChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 rounded-xl font-bold shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4" /> Book Suite
                </Button>
              </DialogTrigger>
              
              {/* 🚀 UX UPGRADE: Increased modal layout size for modern grid positioning */}
              <DialogContent className="sm:max-w-[550px] rounded-2xl border-border bg-card p-6 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">Generate Reservation</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">Open a verified ledger window linked against live system assets.</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateReservation} className="space-y-5 mt-4">
                  
                  {/* 🚀 GUEST ACQUISITION FIELD (AUTOCOMPLETE SYSTEM) */}
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Guest Clearance Search</Label>
                    
                    {!selectedUser ? (
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="Type customer first or last name to index database..." 
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="rounded-xl pl-10 pr-4 bg-background border-border h-11 text-sm shadow-inner"
                          required={!selectedUser}
                        />
                        
                        {/* Dropdown overlay menu of matching query traces */}
                        {userSearchQuery.trim().length >= 2 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto bg-popover text-popover-foreground border border-border shadow-2xl rounded-md z-50 divide-y divide-border">
                            {isSearchingUsers ? (
                              <div className="p-4 text-xs font-bold text-muted-foreground text-center animate-pulse">Scanning server repository...</div>
                            ) : userSearchResults.length === 0 ? (
                              <div className="p-4 text-xs font-bold text-muted-foreground text-center">No matching identities discovered.</div>
                            ) : (
                              userSearchResults.map((u) => (
                                <div 
                                  key={u.id}
                                  onClick={() => setSelectedUser(u)}
                                  className="p-3 hover:bg-accent flex items-center justify-between cursor-pointer text-sm transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center uppercase">
                                      {u.firstName.charAt(0)}{u.lastName?.charAt(0) || ""}
                                    </div>
                                    <div>
                                      <p className="font-bold text-foreground">{u.firstName} {u.lastName}</p>
                                      <p className="text-xs text-muted-foreground">{u.email}</p>
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
                      /* 🚀 SELECTED GUEST CARD */
                      <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center uppercase shadow-md shadow-primary/10">
                            {selectedUser.firstName.charAt(0)}{selectedUser.lastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <p className="font-black text-foreground text-base">{selectedUser.firstName} {selectedUser.lastName}</p>
                            <p className="text-xs font-medium text-muted-foreground">{selectedUser.email}</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedUser(null); setUserSearchQuery(""); }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ROOM INVENTORY ASSIGNMENT */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Suite Mapping</Label>
                    <Select onValueChange={setSelectedRoomId} value={selectedRoomId} required>
                      <SelectTrigger className="rounded-xl bg-background border-border h-11 text-sm shadow-sm"><SelectValue placeholder="Link room asset..." /></SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {rooms.map(r => (
                          <SelectItem key={r.id} value={r.id.toString()} className="rounded-lg cursor-pointer">
                            Room {r.roomNumber} &rarr; {r.hotelName} ({r.roomType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* DATE PICKERS GRID */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkInDate" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Check-in Date</Label>
                      <Input id="checkInDate" name="checkInDate" type="date" required className="rounded-md bg-background border-border h-11 text-sm shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOutDate" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Check-out Date</Label>
                      <Input id="checkOutDate" name="checkOutDate" type="date" required className="rounded-md bg-background border-border h-11 text-sm shadow-sm" />
                    </div>
                  </div>

                  {/* CAPACITY DENSITY ENTRY */}
                  <div className="space-y-2">
                    <Label htmlFor="numberOfGuests" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Number of Guests</Label>
                    <Input id="numberOfGuests" name="numberOfGuests" type="number" min={1} max={10} placeholder="2" required className="rounded-xl bg-background border-border h-11 text-sm shadow-sm" />
                  </div>
                  
                  <Button type="submit" className="w-full mt-6 rounded-xl h-12 text-sm font-bold shadow-lg shadow-primary/10" disabled={isCreating}>
                    {isCreating ? "Processing Ledger Transaction..." : "Confirm Secure Booking"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* CORE DATA TABLE OVERVIEW */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Synchronizing financial ledgers...</div>
      ) : error ? (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex-1">{error}</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden border-border">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Ledger ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Guest Identity</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Branch Asset</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Stay Window</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Financials</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center font-medium text-muted-foreground">No active bookings found matching criteria.</td></tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-black text-muted-foreground">BK-{res.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-foreground">{res.userFirstName} {res.userLastName}</p>
                        <p className="text-xs font-medium text-muted-foreground">{res.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{res.hotelName}</p>
                        <p className="text-xs font-medium text-muted-foreground">Room {res.roomNumber} ({res.roomType})</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{res.checkInDate} <span className="mx-1">&rarr;</span> {res.checkOutDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-primary">${res.totalPrice}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-black border ${
                          res.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          res.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                          res.status === 'COMPLETED' ? 'bg-chart-2/10 text-chart-2 border-chart-2/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && res.status !== 'CANCELLED' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-md"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl bg-card border-border shadow-xl">
                              <DropdownMenuLabel className="font-black">Manage Booking</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCancelReservation(res.id)} className="text-destructive focus:text-destructive rounded-lg cursor-pointer font-bold">
                                <Ban className="mr-2 h-4 w-4" /> Terminate Reservation
                              </DropdownMenuItem>
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

          {/* FOOTER PAGINATOR */}
          <div className="flex items-center justify-between px-6 py-4 bg-card border rounded-2xl shadow-sm border-border mt-auto">
            <span className="text-sm text-muted-foreground font-medium">
              Page <span className="font-black text-foreground">{currentPage + 1}</span> of <span className="font-black text-foreground">{totalPages}</span> ({totalElements} global records)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 0} className="rounded-xl font-bold"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="rounded-xl font-bold">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}