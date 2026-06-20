"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Building2, Users, LogOut, Bed, Calendar } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname(); 
    const { user, logout } = useAuth();

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard, allowedRoles: ["ADMIN", "HOTEL_MANAGER", "CUSTOMER"] },
        { name: "Hotels", href: "/admin/hotels", icon: Building2, allowedRoles: ["ADMIN", "HOTEL_MANAGER"] },
        { name: "Rooms", href: "/admin/rooms", icon: Bed, allowedRoles: ["ADMIN", "HOTEL_MANAGER"] },
        { name: "Reservations", href: "/admin/reservations", icon: Calendar, allowedRoles: ["ADMIN", "HOTEL_MANAGER"] },
        { name: "Users", href: "/admin/users", icon: Users, allowedRoles: ["ADMIN"] },
    ];

    const authorizedNavItems = navItems.filter(item => user && item.allowedRoles.includes(user.role));

    return (
        <div className="flex flex-col w-20 hover:w-64 h-screen px-4 py-8 bg-sidebar border-r border-sidebar-border/50 transition-all duration-300 ease-in-out group z-30 shrink-0 select-none backdrop-blur-md">
            
            {/* BRAND HEADER */}
            <div className="flex items-center gap-3 px-2 mb-2 overflow-hidden whitespace-nowrap">
                <div className="w-10 h-10 flex items-center justify-center shrink-0 filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]">
                    <img src="/logo.png" alt="Oasis" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-xl font-serif font-black tracking-widest text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in uppercase">
                    Oasis
                </h2>
            </div>
            
            {/* ROLE BADGE */}
            <div className="h-4 mb-8 px-2 overflow-hidden whitespace-nowrap">
                <p className="text-[10px] font-black text-primary/80 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {user?.role || "Workspace"}
                </p>
            </div>

            {/* NAVIGATION LINKS (Efecto Burbuja Corregido para Light y Dark Mode) */}
            <nav className="flex flex-col flex-1 space-y-1.5">
                {authorizedNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center h-11 px-3 rounded-md font-bold transition-all duration-200 overflow-hidden whitespace-nowrap group/item border cursor-pointer ${
                                isActive
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10 dark:shadow-none dark:ring-1 dark:ring-white/20" 
                                : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground dark:hover:bg-white/10 dark:hover:text-white"
                            }`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover/item:scale-105 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover/item:text-foreground"}`} />
                            <span className="ml-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* LOGOUT ACTION */}
            <div className="pt-4 border-t border-sidebar-border/50 overflow-hidden whitespace-nowrap">
                <button
                    onClick={logout}
                    className="flex items-center h-11 w-full px-3 text-destructive transition-all duration-200 rounded-md hover:bg-destructive/10 cursor-pointer font-bold"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span className="ml-4 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Sign Out
                    </span>
                </button>
            </div>
            
        </div>
    );
}