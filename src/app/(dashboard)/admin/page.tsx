"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users as UsersIcon, Bed, CalendarCheck, ShieldAlert, Activity, TrendingUp } from "lucide-react";

// 🚀 1. IMPORTAMOS LOS NUEVOS COMPONENTES DE SHADCN CHART
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

// 🚀 2. DATOS SIMULADOS PARA EL GRÁFICO (Booking Velocity)
const bookingTrendData = [
  { month: "Jan", transactions: 120 },
  { month: "Feb", transactions: 180 },
  { month: "Mar", transactions: 240 },
  { month: "Apr", transactions: 210 },
  { month: "May", transactions: 350 },
  { month: "Jun", transactions: 420 },
  { month: "Jul", transactions: 510 },
];

// 🚀 3. CONFIGURACIÓN DEL GRÁFICO (Mapeado a tu paleta OKLCH)
const chartConfig = {
  transactions: {
    label: "Reservations",
    // Usamos el color primario de tu tema CSS
    color: "hsl(var(--primary))", 
  },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();

    const [metrics, setMetrics] = useState({
        totalHotels: 0, totalRooms: 0, totalUsers: 0, totalReservations: 0
    });
    const [isFetchingMetrics, setIsFetchingMetrics] = useState(true);

    const fetchDashboardMetrics = async () => {
        try {
            setIsFetchingMetrics(true);
            const [hotelsRes, roomsRes, usersRes, reservationsRes] = await Promise.all([
                api.get("/hotels?size=1").catch(() => ({ data: { totalElements: 0 } })),
                api.get("/rooms?size=1").catch(() => ({ data: { totalElements: 0 } })),
                api.get("/users?size=1").catch(() => ({ data: { totalElements: 0 } })),
                api.get("/reservations?size=1").catch(() => ({ data: { totalElements: 0 } }))
            ]);

            setMetrics({
                totalHotels: hotelsRes.data?.totalElements || 0,
                totalRooms: roomsRes.data?.totalElements || 0,
                totalUsers: usersRes.data?.totalElements || 0,
                totalReservations: reservationsRes.data?.totalElements || 0
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

    if (authLoading) return null; 

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            
            {/* HEADER */}
            <div className="flex items-start justify-between border-b border-border pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-primary" /> Command Center
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">
                        Workspace: authenticated as Operator <span className="font-bold text-foreground">{user?.firstName} {user?.lastName}</span>
                    </p>
                </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Hotels", val: metrics.totalHotels, icon: Building2, border: "border-l-chart-1" },
                  { title: "Rooms", val: metrics.totalRooms, icon: Bed, border: "border-l-chart-2" },
                  { title: "Identities", val: metrics.totalUsers, icon: UsersIcon, border: "border-l-chart-3" },
                  { title: "Bookings", val: metrics.totalReservations, icon: CalendarCheck, border: "border-l-chart-5" }
                ].map((kpi, idx) => (
                    <Card key={idx} className={`border border-border border-l-4 ${kpi.border} bg-card rounded-2xl`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">{kpi.title}</CardTitle>
                            <kpi.icon className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">
                                {isFetchingMetrics ? <span className="text-muted-foreground/30 animate-pulse">--</span> : kpi.val}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 📊 BOUTIQUE CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 🚀 EL NUEVO GRÁFICO AREA CHART - GRADIENT DE RECHARTS/SHADCN */}
                <Card className="lg:col-span-2 border border-border bg-card rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="pb-0 border-b border-border/40 mb-4 bg-muted/10">
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-chart-2" /> Booking Velocity Matrix
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-muted-foreground">
                            Aggregate reservation volume over the last 7 months.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 pb-4">
                        <div className="h-[300px] w-full mt-4 pr-6">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={bookingTrendData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            {/* El gradiente fluido que cae hacia abajo */}
                                            <linearGradient id="fillTransactions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>

                                        {/* Líneas de cuadrícula horizontales y sutiles */}
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                                        
                                        <XAxis
                                            dataKey="month"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={12}
                                            className="text-[10px] font-bold fill-muted-foreground"
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            className="text-[10px] font-bold fill-muted-foreground"
                                        />

                                        {/* Tooltip interactivo al hacer hover */}
                                        <ChartTooltip
                                            cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            content={<ChartTooltipContent indicator="line" className="bg-card border-border shadow-xl rounded-xl font-bold" />}
                                        />
                                        
                                        {/* El área con curva 'monotone' (suave) */}
                                        <Area
                                            dataKey="transactions"
                                            type="monotone"
                                            fill="url(#fillTransactions)"
                                            fillOpacity={1}
                                            stroke="var(--color-chart-1)"
                                            strokeWidth={3}
                                            activeDot={{ r: 6, fill: "var(--color-background)", stroke: "var(--color-chart-1)", strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* CAPACITY DENSITY BARS (SIDE PANEL) */}
                <Card className="border border-border bg-card rounded-2xl shadow-sm">
                    <CardHeader className="border-b border-border bg-muted/20">
                        <CardTitle className="text-lg font-black flex items-center gap-2"><Bed className="w-5 h-5 text-chart-4" /> Capacity Density</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground">Inventory distribution metrics.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {[
                          { name: "Single Suites", pct: "65%", color: "bg-chart-1" },
                          { name: "Double Rooms", pct: "40%", color: "bg-chart-2" },
                          { name: "Presidential Vaults", pct: "15%", color: "bg-chart-3" },
                        ].map((bar, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                                    <span className="text-foreground">{bar.name}</span>
                                    <span className="text-muted-foreground">{bar.pct}</span>
                                </div>
                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/50 shadow-inner">
                                    <div className={`h-full ${bar.color} rounded-full transition-all duration-[1.5s] ease-out`} style={{ width: bar.pct }}></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* SECURITY METADATA CARD */}
            <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden mt-10">
                <div className="border-l-4 border-l-primary flex flex-col md:flex-row md:items-center">
                    <div className="p-6 md:w-1/3 bg-muted/20 h-full border-r border-border/40">
                        <h3 className="text-lg font-black flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-primary" /> Security Clearance</h3>
                        <p className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed">Decoded JWT profile scope metadata mapping from the Spring Security engine.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 flex-1 bg-background">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Ecosystem Principal</p>
                            <p className="text-sm font-bold text-foreground">{user?.firstName} {user?.lastName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Mail Routing</p>
                            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Coordinate</p>
                            <p className="text-sm font-mono text-primary font-bold">USR_IDX_{user?.id}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">RBAC Group</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black bg-primary/10 text-primary border border-primary/20 mt-1">
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}