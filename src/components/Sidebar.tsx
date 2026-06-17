"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// We import modern icons from lucide-react
import { LayoutDashboard, Building2, Users, Settings, LogOut } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname(); // Tells us exactly which URL the user is on right now
    const { logout } = useAuth();

    // We define our navigation menu dynamically
    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Hotels", href: "/admin/hotels", icon: Building2 },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="flex flex-col w-64 h-screen px-4 py-8 bg-white border-r border-zinc-200">
        
        {/* Brand Header */}
        <h2 className="px-2 text-2xl font-bold tracking-tight text-zinc-900">
            Oasis Hotel
        </h2>
        <p className="px-2 mb-8 text-sm text-zinc-500">Admin Workspace</p>

        {/* Navigation Links */}
        <nav className="flex-col flex-1 space-y-1">
            {navItems.map((item) => {
            // Check if the current URL matches the link's destination
            const isActive = pathname === item.href;
            
            return (
                <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                    isActive
                    ? "bg-zinc-100 text-zinc-900" // Active state style
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900" // Inactive state style
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

        {/* Logout Button (Fixed at the bottom) */}
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