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
        <div className="flex flex-col w-64 h-screen px-4 py-8 bg-sidebar border-r border-sidebar-border transition-colors duration-500">
            
            {/* BRAND HEADER */}
            <div className="flex items-center gap-2 px-2 mb-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground p-1.5 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-sidebar-foreground">
                    Oasis
                </h2>
            </div>
            
            {/* DYNAMIC ROLE BADGE */}
            <p className="px-2 mb-8 text-xs font-bold text-sidebar-primary uppercase tracking-widest">
                {user?.role || "Workspace"}
            </p>

            {/* NAVIGATION LINKS */}
            <nav className="flex-col flex-1 space-y-1.5">
                {authorizedNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-3 text-sm font-bold rounded-xl transition-all duration-200 group ${
                                isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20" 
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            }`}
                        >
                            <item.icon
                                className={`mr-3 w-5 h-5 ${
                                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
                                }`}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* LOGOUT ACTION */}
            <div className="pt-4 mt-auto border-t border-sidebar-border">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-3 text-sm font-bold text-destructive transition-colors rounded-xl hover:bg-destructive/10 group"
                >
                    <LogOut className="w-5 h-5 mr-3 text-destructive/70 group-hover:text-destructive" />
                    Secure Sign Out
                </button>
            </div>
            
        </div>
    );
}