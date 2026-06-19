"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ReservationStatus, RoomType } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, User, Search, XCircle, CreditCard, Hotel, Eye, Hash } from "lucide-react";

// Local interface representing the API response matching ReservationResponseDTO
interface ReservationData {
    id: number;
    userId: number;
    userFirstName: string;
    userLastName: string;
    userEmail: string;
    hotelId: number;
    hotelName: string;
    roomId: number;
    roomNumber: string;
    roomType: RoomType;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    totalPrice: number;
    status: ReservationStatus;
    createdAt: string;
}

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<ReservationData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search parameters filter states
    const [searchUserId, setSearchUserId] = useState("");
    const [selectedRoomType, setSelectedRoomType] = useState<RoomType | "">("");

    // 1. Fetch reservations assigned to a specific User ID (GET /reservations/user/{id})
    const handleSearchByUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchUserId) return;

        try {
        setIsLoading(true);
        setError(null);
        setSelectedRoomType(""); // Reset alternative filter context

        const response = await api.get(`/reservations/user/${searchUserId}`);
        
        // Parse Spring Data Pageable structure safely
        const data = response.data?.content || response.data || [];
        setReservations(Array.isArray(data) ? data : []);
        } catch (err: any) {
        console.error("User search criteria failed:", err);
        setError(err.response?.data?.message || "No lookup matching records for this User ID.");
        setReservations([]);
        } finally {
        setIsLoading(false);
        }
    };

    // 2. Fetch reservations matching a specific Room Type category (GET /reservations/search/room-type)
    const handleFilterByRoomType = async (roomType: RoomType) => {
        if (!roomType) return;

        try {
        setIsLoading(true);
        setError(null);
        setSearchUserId(""); // Reset alternative filter context
        setSelectedRoomType(roomType);

        const response = await api.get(`/reservations/search/room-type`, {
            params: { roomType }
        });

        const data = response.data?.content || response.data || [];
        setReservations(Array.isArray(data) ? data : []);
        } catch (err: any) {
        console.error("Room type query criteria failed:", err);
        setError("Failed to fetch matching reservation room records.");
        setReservations([]);
        } finally {
        setIsLoading(false);
        }
    };

    // 3. Process cryptographic transaction cancellation (PUT /reservations/{id}/cancel)
    const handleCancelReservation = async (id: number) => {
        if (!window.confirm(`Are you strictly sure you want to cancel reservation ticket #${id}?`)) return;

        try {
        await api.put(`/reservations/${id}/cancel`);
        alert(`Reservation #${id} canceled successfully.`);
        
        // Update local state smoothly without losing current active dataset filter
        setReservations(prev => 
            prev.map(res => res.id === id ? { ...res, status: ReservationStatus.CANCELLED } : res)
        );
        } catch (err: any) {
        console.error("Cancellation request rejected:", err);
        alert(err.response?.data?.message || "Failed to cancel reservation.");
        }
    };

    // Helper function to handle conditional aesthetic status renders
    const renderStatusBadge = (status: ReservationStatus) => {
        switch (status) {
        case ReservationStatus.CONFIRMED:
            return <span className="px-2.5 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full border border-green-200">Confirmed</span>;
        case ReservationStatus.CANCELLED:
            return <span className="px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full border border-red-200">Cancelled</span>;
        default:
            return <span className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full border border-amber-200">Pending Approval</span>;
        }
    };

    return (
        <div className="p-8 space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Reservations Ledger</h1>
            <p className="text-zinc-500">Monitor booking transactions, check-in schedules, and perform cancellations.</p>
        </div>

        {/* SEARCH AND FILTERS TOOLBAR COMPONENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            
            {/* Lookup by exact User Database ID */}
            <form onSubmit={handleSearchByUser} className="space-y-2">
            <Label htmlFor="userIdQuery">Search by Customer ID</Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input id="userIdQuery" type="number" placeholder="Enter User ID..." value={searchUserId} onChange={(e) => setSearchUserId(e.target.value)} className="pl-9" required />
                </div>
                <Button type="submit" variant="secondary"><Search className="h-4 w-4" /></Button>
            </div>
            </form>

            {/* Filter by Room Architecture Category */}
            <div className="space-y-2">
            <Label htmlFor="roomTypeFilter">Filter by Room Type Category</Label>
            <select id="roomTypeFilter" value={selectedRoomType} onChange={(e) => handleFilterByRoomType(e.target.value as RoomType)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
                <option value="">-- Click to Select a Filter --</option>
                <option value="SINGLE">Single Room</option>
                <option value="DOUBLE">Double Room</option>
                <option value="MATRIMONIAL">Matrimonial Suite</option>
                <option value="SUITE">Executive Suite</option>
                <option value="PRESIDENTIAL">Presidential Quarter</option>
            </select>
            </div>

            {/* Active Query Filter Status Card Indicators */}
            <div className="flex items-end justify-start lg:justify-end">
            {reservations.length > 0 && (
                <div className="text-sm font-medium text-zinc-500 bg-zinc-50 border px-4 py-2 rounded-lg">
                Showing <span className="text-zinc-900 font-bold">{reservations.length}</span> active query transaction cards.
                </div>
            )}
            </div>
        </div>

        {/* CONTROL FLOW FEEDBACK LABELS */}
        {isLoading && <div className="py-12 text-center text-zinc-500 animate-pulse font-medium">Scanning transactional ledger database records...</div>}
        {error && <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">{error}</div>}

        {/* DATA GRID TRANSACTION LAYOUT */}
        {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reservations.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed rounded-xl col-span-full text-zinc-400 bg-white">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                <p className="font-medium text-zinc-500">No matching reservations found inside the viewport layer.</p>
                <p className="text-xs text-zinc-400 mt-1">Submit a valid user lookup search or apply a specific room category type filter above.</p>
                </div>
            ) : (
                reservations.map((ticket) => (
                <Card key={ticket.id} className={`overflow-hidden border transition-all hover:shadow-md bg-white ${
                    ticket.status === ReservationStatus.CANCELLED ? 'opacity-75 border-red-100' : 'border-zinc-200'
                }`}>
                    {/* Header Section */}
                    <CardHeader className="pb-3 border-b bg-zinc-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-zinc-400" />
                        <span className="font-mono text-sm font-bold text-zinc-900">RES-{ticket.id}</span>
                        </div>
                        {renderStatusBadge(ticket.status)}
                    </div>
                    </CardHeader>

                    {/* Content Section */}
                    <CardContent className="pt-4 space-y-4">
                    {/* Hotel branch context mapping */}
                    <div className="flex items-start gap-3 text-sm">
                        <Hotel className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                        <div>
                        <p className="font-bold text-zinc-900 leading-tight">{ticket.hotelName}</p>
                        <p className="text-xs text-zinc-500">Room {ticket.roomNumber} ({ticket.roomType.toLowerCase()})</p>
                        </div>
                    </div>

                    {/* Customer context mapping card */}
                    <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 space-y-1 text-xs">
                        <p className="text-zinc-400 font-semibold uppercase tracking-wider">Guest Profile Information</p>
                        <p className="font-medium text-zinc-800">{ticket.userFirstName} {ticket.userLastName} <span className="text-zinc-400 font-mono">(ID: {ticket.userId})</span></p>
                        <p className="text-zinc-500 truncate">{ticket.userEmail}</p>
                    </div>

                    {/* Schedule dates details mapping */}
                    <div className="grid grid-cols-2 gap-4 border-t border-b py-3 text-xs">
                        <div>
                        <p className="text-zinc-400 font-medium">Check-In Date</p>
                        <p className="font-bold text-zinc-700 mt-0.5">{ticket.checkInDate}</p>
                        </div>
                        <div>
                        <p className="text-zinc-400 font-medium">Check-Out Date</p>
                        <p className="font-bold text-zinc-700 mt-0.5">{ticket.checkOutDate}</p>
                        </div>
                    </div>

                    {/* Pricing metrics and administrative contextual menu */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-zinc-900">
                        <CreditCard className="w-4 h-4 text-zinc-400" />
                        <span className="text-xl font-black">${ticket.totalPrice}</span>
                        <span className="text-xs text-zinc-400 font-medium">({ticket.numberOfGuests} guests)</span>
                        </div>

                        {/* ACTIONS INTERACTION CONTEXT MENU */}
                        {ticket.status !== ReservationStatus.CANCELLED && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Management Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCancelReservation(ticket.id)} className="text-red-600 focus:text-red-600 font-medium">
                                <XCircle className="mr-2 h-4 w-4" /> Cancel Booking
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                    </div>
                    </CardContent>
                </Card>
                ))
            )}
            </div>
        )}
        </div>
    );
}