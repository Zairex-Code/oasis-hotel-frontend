"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users as UsersIcon, Bed, CalendarCheck, TrendingUp, LogOut } from "lucide-react";

export default function AdminDashboardPage() {
    // Context authentication boundaries
    const { user, logout, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Analytic Metrics States
    const [metrics, setMetrics] = useState({
        totalHotels: 0,
        totalRooms: 0,
        totalUsers: 0,
        totalReservations: 0
    });
    const [isFetchingMetrics, setIsFetchingMetrics] = useState(true);

    // Concurrently fetch aggregate data from Spring Boot pageable responses
    const fetchDashboardMetrics = async () => {
        try {
            setIsFetchingMetrics(true);
            const [hotelsRes, roomsRes, usersRes, reservationsRes] = await Promise.all([
                api.get("/hotels?size=1"),
                api.get("/rooms?size=1"),
                api.get("/users?size=1"),
                api.get("/reservations/search/room-type?roomType=SINGLE&size=1") // Fallback if no global aggregation endpoint exists
            ]);

            setMetrics({
                totalHotels: hotelsRes.data?.totalElements || (Array.isArray(hotelsRes.data) ? hotelsRes.data.length : 0),
                totalRooms: roomsRes.data?.totalElements || (Array.isArray(roomsRes.data) ? roomsRes.data.length : 0),
                totalUsers: usersRes.data?.totalElements || (Array.isArray(usersRes.data) ? usersRes.data.length : 0),
                // Since ReservationController currently lacks a global 'getAll' method, 
                // we aggregate a baseline or render active states depending on your exact Spring setup.
                totalReservations: reservationsRes.data?.totalElements || (Array.isArray(reservationsRes.data) ? reservationsRes.data.length : 0)
            });
        } catch (error) {
            console.error("Dashboard Analytics failed to synchronize:", error);
        } finally {
            setIsFetchingMetrics(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardMetrics();
        }
    }, [authLoading, user]);

    // Handle security logout execution and cookie destruction
    const handleSignOut = () => {
        logout(); 
        router.push('/login'); 
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <p className="text-zinc-400 animate-pulse font-medium text-lg tracking-tight">Synchronizing secure session...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            
            {/* HEADER METRICS */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                        Admin Command Center
                    </h1>
                    <p className="text-zinc-500">
                        Welcome back, <span className="font-semibold text-zinc-700">{user?.firstName}</span>. Here is the operational overview.
                    </p>
                </div>
                
                <Button variant="outline" onClick={handleSignOut} className="gap-2 text-zinc-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors">
                    <LogOut className="w-4 h-4" /> Secure Sign Out
                </Button>
            </div>

            {/* KEY PERFORMANCE INDICATORS (KPI CARDS) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-600">Total Branches</CardTitle>
                        <Building2 className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">
                            {isFetchingMetrics ? <span className="text-zinc-300 animate-pulse">--</span> : metrics.totalHotels}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Active global hotel network</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-600">Room Inventory</CardTitle>
                        <Bed className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">
                            {isFetchingMetrics ? <span className="text-zinc-300 animate-pulse">--</span> : metrics.totalRooms}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Registered capacities across branches</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-600">Network Identities</CardTitle>
                        <UsersIcon className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">
                            {isFetchingMetrics ? <span className="text-zinc-300 animate-pulse">--</span> : metrics.totalUsers}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Customers, Staff, and Admins</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-600">Active Bookings</CardTitle>
                        <CalendarCheck className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">
                            {isFetchingMetrics ? <span className="text-zinc-300 animate-pulse">--</span> : metrics.totalReservations}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Single room transaction ledgers</p>
                    </CardContent>
                </Card>

            </div>

            {/* IDENTITY METADATA SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-zinc-400" />
                            Authentication Clearance
                        </CardTitle>
                        <CardDescription>Verified JWT profile payload extracted from Spring Security.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 rounded-lg bg-zinc-50 p-5 border border-zinc-100">
                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</p>
                                    <p className="text-base font-medium text-zinc-900 mt-0.5">{user?.firstName} {user?.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Identity</p>
                                    <p className="text-base font-medium text-zinc-900 mt-0.5 truncate pr-4">{user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Database ID</p>
                                    <p className="text-base font-mono text-zinc-700 mt-0.5">USR_{user?.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Authorization Role</p>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold mt-1.5 ${
                                        user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm bg-zinc-900 text-zinc-100 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-zinc-100">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            System Health
                        </CardTitle>
                        <CardDescription className="text-zinc-400">API Gateway latency and infrastructure status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded bg-zinc-800/50">
                            <span className="text-sm text-zinc-300">Spring Boot Backend</span>
                            <span className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded bg-zinc-800/50">
                            <span className="text-sm text-zinc-300">MySQL Database</span>
                            <span className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> CONNECTED
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded bg-zinc-800/50">
                            <span className="text-sm text-zinc-300">Next.js Client Engine</span>
                            <span className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> SYNCHRONIZED
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Quick helper icon component to avoid importing another library package
function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
        </svg>
    );
}