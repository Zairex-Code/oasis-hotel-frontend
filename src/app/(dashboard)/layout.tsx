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

    // SECURITY GUARD
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    // LOADING STATE (Now theme-aware)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background w-full transition-colors duration-500">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    // MAIN DASHBOARD SHELL
    return (
        <div className="flex w-full min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden font-sans">
            <Sidebar />
            <main className="flex-1 w-full h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    );
}