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
    const { user, isLoading } = useAuth(); 
    const router = useRouter();

    // SECURITY GUARD: Monitor authentication state changes
    useEffect(() => {
        if (!isLoading && !user) {
            console.warn("Unauthorized access detected. Redirecting to login.");
            router.push("/login");
        }
    }, [user, isLoading, router]);

    // 1. Loading screen
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 w-full">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-zinc-500 animate-pulse">
                        Verifying credentials...
                    </p>
                </div>
            </div>
        );
    }

    // 2. Prevent flash of unauthorized content
    if (!user) {
        return null;
    }

    // 3. MAIN DASHBOARD RENDER
    return (
        // 🚀 FIX 1: Added 'w-full' to ensure the background stretches screen-to-screen
        <div className="flex w-full min-h-screen bg-zinc-50 overflow-hidden">
            
            {/* Sidebar stays fixed on the left */}
            <Sidebar />
            
            {/* 🚀 FIX 2: 'flex-1' and 'w-full' force this main container to eat up 100% of the remaining empty space */}
            <main className="flex-1 w-full h-screen overflow-y-auto">
                {children}
            </main>
            
        </div>
    );
}