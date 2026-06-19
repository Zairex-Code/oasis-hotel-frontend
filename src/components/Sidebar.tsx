"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Building2, Users, Settings, LogOut, Bed, Calendar } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname(); 
    // 1. ADVANCED RBAC: Extract the decoded 'user' object from our global state
    const { user, logout } = useAuth();

    // 2. DEFINE ACCESS CONTROL LISTS (ACL) FOR NAVIGATION
    // We strictly map which system roles are allowed to see which navigation menus.
    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard, allowedRoles: ["ADMIN", "HOTEL_MANAGER", "CUSTOMER"] },
        { name: "Hotels", href: "/admin/hotels", icon: Building2, allowedRoles: ["ADMIN", "HOTEL_MANAGER"] },
        { name: "Rooms", href: "/admin/rooms", icon: Bed, allowedRoles: ["ADMIN", "HOTEL_MANAGER"] },
        { name: "Reservations", href: "/admin/reservations", icon: Calendar, allowedRoles: ["ADMIN", "HOTEL_MANAGER"] },
        // Highly sensitive global menu: Only System Admins can manage identities
        { name: "Users", href: "/admin/users", icon: Users, allowedRoles: ["ADMIN"] },
        { name: "Settings", href: "/admin/settings", icon: Settings, allowedRoles: ["ADMIN", "HOTEL_MANAGER", "CUSTOMER"] },
    ];

    // 3. SECURITY FILTER: Only render items where the user's role is included in the allowed list
    const authorizedNavItems = navItems.filter(item => user && item.allowedRoles.includes(user.role));

    return (
        <div className="flex flex-col w-64 h-screen px-4 py-8 bg-white border-r border-zinc-200">
            {/* Brand Header */}
            <h2 className="px-2 text-2xl font-bold tracking-tight text-zinc-900">
                Oasis Hotel
            </h2>
            
            {/* Dynamic UI Subtitle based on Role */}
            <p className="px-2 mb-8 text-sm font-semibold text-blue-600 uppercase tracking-wider">
                {user?.role || "Workspace"}
            </p>

            {/* Navigation Links */}
            <nav className="flex-col flex-1 space-y-1">
                {authorizedNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                                isActive
                                ? "bg-zinc-100 text-zinc-900" 
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                            }`}
                        >
                            <item.icon
                                className={`mr-3 w-5 h-5 ${
                                isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-500"
                                }`}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-4 mt-auto border-t border-zinc-200">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 transition-colors rounded-md hover:bg-red-50 group"
                >
                    <LogOut className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-500" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}