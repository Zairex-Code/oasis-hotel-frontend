"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Reservation } from "@/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users as UsersIcon, Bed, CalendarCheck, Activity, TrendingUp, CreditCard, ArrowUpRight } from "lucide-react";

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

const bookingTrendData = [
  { month: "Jan", transactions: 120 }, { month: "Feb", transactions: 180 },
  { month: "Mar", transactions: 240 }, { month: "Apr", transactions: 210 },
  { month: "May", transactions: 350 }, { month: "Jun", transactions: 420 },
  { month: "Jul", transactions: 510 },
];

const chartConfig = {
  transactions: { label: "Reservations", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [metrics, setMetrics] = useState({ totalHotels: 0, totalRooms: 0, totalUsers: 0, totalReservations: 0 });
    const [recentBookings, setRecentBookings] = useState<Reservation[]>([]);
    const [isFetchingMetrics, setIsFetchingMetrics] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setIsFetchingMetrics(true);
            const [hotelsRes, roomsRes, usersRes, reservationsRes, recentRes] = await Promise.all([
                api.get("/hotels?size=1").catch(() => ({ data: { totalElements: 0 } })),
                api.get("/rooms?size=1").catch(() => ({ data: { totalElements: 0 } })),
                api.get("/users?size=1").catch(() => ({ data: { totalElements: 0 } })),
                api.get("/reservations?size=1").catch(() => ({ data: { totalElements: 0 } })),
                api.get("/reservations?size=5&sort=createdAt,desc").catch(() => ({ data: { content: [] } }))
            ]);

            setMetrics({
                totalHotels: hotelsRes.data?.totalElements || 0,
                totalRooms: roomsRes.data?.totalElements || 0,
                totalUsers: usersRes.data?.totalElements || 0,
                totalReservations: reservationsRes.data?.totalElements || 0
            });
            setRecentBookings(recentRes.data?.content || []);
        } catch (error) { console.error("Error", error); } finally { setIsFetchingMetrics(false); }
    };

    useEffect(() => { if (!authLoading && user) fetchDashboardData(); }, [authLoading, user]);

    if (authLoading) return null; 

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex items-end justify-between border-b border-border/50 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Activity className="w-7 h-7 text-primary" /> Overview
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">
                        Welcome back, <span className="font-bold text-foreground">{user?.firstName}</span>. Here's what's happening today.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Total Revenue", val: `$${(metrics.totalReservations * 250).toLocaleString()}`, icon: CreditCard, trend: "+20.1%", desc: "from last month" },
                  { title: "Network Identities", val: metrics.totalUsers, icon: UsersIcon, trend: "+12.5%", desc: "new users acquired" },
                  { title: "Active Branches", val: metrics.totalHotels, icon: Building2, trend: "Stable", desc: "operational state" },
                  { title: "Global Bookings", val: metrics.totalReservations, icon: CalendarCheck, trend: "+8.2%", desc: "active ledgers" }
                ].map((kpi, idx) => (
                    <Card key={idx} className="border border-border/50 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:ring-1 dark:ring-white/10 cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold text-muted-foreground tracking-tight uppercase">{kpi.title}</CardTitle>
                            <kpi.icon className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tighter text-foreground">
                                {isFetchingMetrics ? <span className="text-muted-foreground/30 animate-pulse">--</span> : kpi.val}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                                <span className={kpi.trend.includes('+') ? 'text-emerald-500 font-black flex items-center' : 'text-primary font-black'}>
                                    {kpi.trend.includes('+') && <ArrowUpRight className="w-3 h-3 mr-0.5" />} {kpi.trend}
                                </span> 
                                {kpi.desc}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <Card className="lg:col-span-4 border border-border/50 bg-card/40 backdrop-blur-md shadow-sm flex flex-col dark:ring-1 dark:ring-white/10">
                    <CardHeader className="pb-0 mb-4">
                        <CardTitle className="text-lg font-black tracking-tight">Booking Velocity</CardTitle>
                        <CardDescription className="text-sm font-medium text-muted-foreground">Aggregate reservation volume over the last 7 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 pb-4">
                        <div className="h-[350px] w-full mt-4 pr-6">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={bookingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="fillTransactions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} className="text-xs font-bold fill-muted-foreground" />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={10} className="text-xs font-bold fill-muted-foreground" />
                                        <ChartTooltip cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4' }} content={<ChartTooltipContent indicator="line" className="bg-background/90 backdrop-blur-md border-border/50 shadow-xl rounded-md font-bold" />} />
                                        <Area dataKey="transactions" type="monotone" fill="url(#fillTransactions)" fillOpacity={1} stroke="var(--color-chart-1)" strokeWidth={3} activeDot={{ r: 6, fill: "var(--color-background)", stroke: "var(--color-chart-1)", strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border border-border/50 bg-card/40 backdrop-blur-md shadow-sm dark:ring-1 dark:ring-white/10">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Recent Sales</CardTitle>
                        <CardDescription className="text-sm font-medium text-muted-foreground">Latest transactions processed by the network.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {isFetchingMetrics ? (
                                <div className="text-center text-muted-foreground text-sm font-bold animate-pulse py-10">Fetching live ledgers...</div>
                            ) : recentBookings.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-10">No recent activity detected.</div>
                            ) : (
                                recentBookings.map((res) => (
                                    <div key={res.id} className="flex items-center group cursor-default hover:bg-accent/30 p-2 -mx-2 rounded-md transition-colors">
                                        <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs uppercase shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                            {res.userFirstName?.charAt(0)}{res.userLastName?.charAt(0)}
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-bold leading-none text-foreground">{res.userFirstName} {res.userLastName}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{res.userEmail}</p>
                                        </div>
                                        <div className="ml-auto font-black text-sm text-primary group-hover:scale-105 transition-transform">
                                            +${res.totalPrice}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}