"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Reservation, Room, User } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, MoreHorizontal, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReservationsPage() {
  const { user: currentUser } = useAuth();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Selection states for the Create Modal
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Fetch Core Reservations + Dependencies for the Form
  const fetchData = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [resData, roomsData, usersData] = await Promise.all([
        api.get(`/reservations?page=${pageToFetch}`),
        api.get("/rooms?size=100"), // Get available rooms for the dropdown
        api.get("/users?size=100")  // Get users for the dropdown
      ]);

      if (resData.data?.content) {
        setReservations(resData.data.content);
        setTotalPages(resData.data.totalPages || 1);
        setTotalElements(resData.data.totalElements || resData.data.content.length);
      }

      setRooms(roomsData.data?.content || []);
      setUsers(usersData.data?.content || []);
      
    } catch (err: any) {
      console.error("Error fetching reservation data:", err);
      setError("Failed to synchronize reservation ledgers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const payload = {
        userId: Number(selectedUserId),
        roomId: Number(selectedRoomId),
        checkInDate: formData.get("checkInDate"),
        checkOutDate: formData.get("checkOutDate"),
        numberOfGuests: Number(formData.get("numberOfGuests"))
      };

      await api.post("/reservations", payload);
      
      setIsCreateModalOpen(false);
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

  const handlePreviousPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };
  const handleNextPage = () => { if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1); };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Reservations</h1>
          <p className="text-zinc-500">Global ledger of upcoming and past bookings.</p>
        </div>
        
        {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Book Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Reservation</DialogTitle>
                <DialogDescription>Assign a room to a registered guest.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateReservation} className="space-y-4 mt-4">
                
                <div className="space-y-2">
                  <Label>Guest (User)</Label>
                  <Select onValueChange={setSelectedUserId} required>
                    <SelectTrigger><SelectValue placeholder="Select a guest" /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.firstName} {u.lastName} ({u.email})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Room</Label>
                  <Select onValueChange={setSelectedRoomId} required>
                    <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                    <SelectContent>
                      {rooms.map(r => <SelectItem key={r.id} value={r.id.toString()}>Room {r.roomNumber} - {r.hotelName} ({r.roomType})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Check-in</Label>
                    <Input id="checkInDate" name="checkInDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Check-out</Label>
                    <Input id="checkOutDate" name="checkOutDate" type="date" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfGuests">Number of Guests</Label>
                  <Input id="numberOfGuests" name="numberOfGuests" type="number" min={1} required />
                </div>
                
                <Button type="submit" className="w-full mt-6" disabled={isCreating}>
                  {isCreating ? "Processing..." : "Confirm Booking"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && <div className="py-12 text-center text-zinc-500 animate-pulse flex-1">Synchronizing ledgers...</div>}
      {error && <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border-red-200 flex-1">{error}</div>}

      {!isLoading && !error && (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          
          {/* DATA TABLE */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden border-zinc-200">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Booking ID</th>
                  <th className="px-6 py-4 font-medium">Guest Identity</th>
                  <th className="px-6 py-4 font-medium">Branch & Room</th>
                  <th className="px-6 py-4 font-medium">Stay Window</th>
                  <th className="px-6 py-4 font-medium">Financials</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {reservations.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No active bookings found.</td></tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">BK-{res.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-900">{res.userFirstName} {res.userLastName}</p>
                        <p className="text-xs text-zinc-500">{res.userEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-900">{res.hotelName}</p>
                        <p className="text-xs text-zinc-500">Room {res.roomNumber} ({res.roomType})</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Calendar className="w-3 h-3" />
                          <span>{res.checkInDate} &rarr; {res.checkOutDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-600">
                        ${res.totalPrice}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                          res.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                          res.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {['ADMIN', 'HOTEL_MANAGER'].includes(currentUser?.role || '') && res.status !== 'CANCELLED' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4 text-zinc-500" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Manage Booking</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleCancelReservation(res.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Ban className="mr-2 h-4 w-4" /> Cancel Reservation
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

          {/* PAGINATION CONTROLS */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border rounded-lg shadow-sm border-zinc-200 mt-auto">
            <span className="text-sm text-zinc-500">
              Showing page <span className="font-medium text-zinc-900">{currentPage + 1}</span> of <span className="font-medium text-zinc-900">{totalPages}</span> 
              {" "} ({totalElements} global records)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 0}><ChevronLeft className="w-4 h-4" /> Previous</Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages - 1}>Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}