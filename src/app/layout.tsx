"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Sun, Moon, User as UserIcon } from "lucide-react";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, isLoading, isDarkMode, toggleDarkMode } = useAuth(); 
    const router = useRouter();

    // SECURITY GUARD: Check authentication status
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    // THEME-AWARE LOADING VIEW
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background w-full transition-colors duration-500">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex w-full min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden font-sans">
            
            {/* 🚀 Hover-collapsible Sidebar Component */}
            <Sidebar />
            
            {/* Main view container area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* 🚀 GLOBAL DASHBOARD TOPBAR: Houses the global theme toggle switch */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0 transition-colors duration-500">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Internal Network
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* 🌓 GLOBAL THEME CONTROLLER */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleDarkMode} 
                            className="rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Toggle Global Theme"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
                        </Button>

                        {/* User Identity Display */}
                        <div className="flex items-center gap-2 pl-2 border-l border-border">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground hidden sm:inline-block">
                                {user.firstName}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Inner Screen Scope */}
                <div className="flex-1 overflow-y-auto bg-background transition-colors duration-500">
                    {children}
                </div>
            </div>
            
        </div>
    );
}