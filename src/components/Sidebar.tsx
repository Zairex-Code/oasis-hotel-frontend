"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Building2, Users, LogOut, Bed, Calendar, Sparkles } from "lucide-react";

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
        /* 🚀 HOVER EXPANSION ENGINE: Base width is w-20 (Icons only). On hover, it expands smoothly to w-64 */
        <div className="flex flex-col w-20 hover:w-64 h-screen px-4 py-8 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out group z-30 shrink-0 select-none">
            
            {/* BRAND HEADER */}
            <div className="flex items-center gap-3 px-2 mb-2 overflow-hidden whitespace-nowrap">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-xl shrink-0">
                    <Sparkles className="w-4 h-4" />
                </div>
                {/* 🚀 group-hover:opacity-100 makes text fade in beautifully when sidebar expands */}
                <h2 className="text-xl font-black tracking-tighter text-sidebar-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in">
                    Oasis
                </h2>
            </div>
            
            {/* DYNAMIC ROLE BADGE */}
            <div className="h-4 mb-8 px-2 overflow-hidden whitespace-nowrap">
                <p className="text-[10px] font-black text-sidebar-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {user?.role || "Workspace"}
                </p>
            </div>

            {/* NAVIGATION LINKS */}
            <nav className="flex flex-col flex-1 space-y-2">
                {authorizedNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center h-12 px-3 rounded-xl font-bold transition-all duration-200 overflow-hidden whitespace-nowrap ${
                                isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/10" 
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            }`}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {/* Text labels fade out when sidebar is collapsed */}
                            <span className="ml-4 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* LOGOUT ACTION */}
            <div className="pt-4 border-t border-sidebar-border overflow-hidden whitespace-nowrap">
                <button
                    onClick={logout}
                    className="flex items-center h-12 w-full px-3 text-destructive transition-colors rounded-xl hover:bg-destructive/10"
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