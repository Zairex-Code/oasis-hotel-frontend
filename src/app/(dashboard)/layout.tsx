"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
    }: Readonly<{
    children: React.ReactNode;
    }>) {
    const { user, isLoading } = useAuth(); // Access our safe box
    const router = useRouter();

    // SECURITY GUARD: Monitor authentication state changes
    useEffect(() => {
        // If the Context finished checking LocalStorage and NO user was found, kick them out!
        if (!isLoading && !user) {
        console.warn("Unauthorized access detected. Redirecting to login.");
        router.push("/login");
        }
    }, [user, isLoading, router]);

    // 1. While checking the safe box, show a clean, high-end loading screen
    if (isLoading) {
        return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50">
            <div className="flex flex-col items-center space-y-4">
            {/* A simple, elegant CSS pulse loading animation */}
            <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-zinc-500 animate-pulse">
                Verifying credentials...
            </p>
            </div>
        </div>
        );
    }

    // If there's no user, return null to render absolutely NOTHING
    // This prevents the protected HTML from flashing on the screen before the redirect happens
    if (!user) {
        return null;
    }

    // 3. Success! The user is verified. Render the sidebar, topbar, or the page itself (children)
    return (
        <div className="min-h-screen bg-zinc-50">
            <Sidebar />
        {/* Future global components for the admin panel (like a Sidebar) will be placed here! */}
        <main>{children}</main>
        </div>
    );
}