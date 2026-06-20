"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Sun, Moon, User as UserIcon, ShieldCheck } from "lucide-react";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, isLoading, isDarkMode, toggleDarkMode } = useAuth(); 
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

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
            
            <Sidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                
                {/* 🚀 TOPBAR FLOTANTE GLASSMORPHISM */}
                <div className="absolute top-0 left-0 right-0 z-40 p-4">
                    <header className="h-16 border border-border/50 bg-card/60 backdrop-blur-2xl rounded-md shadow-sm flex items-center justify-between px-6 transition-all duration-500 dark:ring-1 dark:ring-white/10">
                        
                        {/* Estado de Red e Identidad */}
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[10px] font-black bg-primary/10 text-primary px-3 py-1.5 rounded-md uppercase tracking-widest shadow-inner border border-primary/20">
                                <ShieldCheck className="w-3 h-3" /> Secure Network
                            </span>
                            <span className="hidden md:inline-block text-xs font-bold text-muted-foreground uppercase tracking-widest border-l border-border/50 pl-4">
                                Clearance Level: <span className="text-foreground">{user.role.replace('_', ' ')}</span>
                            </span>
                        </div>
                        
                        {/* Controles de Usuario */}
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={toggleDarkMode} 
                                className="rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer"
                                aria-label="Toggle Global Theme"
                            >
                                {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
                            </Button>

                            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-foreground leading-none">{user.firstName} {user.lastName}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{user.email}</p>
                                </div>
                                <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-default ring-2 ring-background">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </header>
                </div>

                {/* Sub-pantalla activa interna (Con padding top para acomodar el navbar flotante) */}
                <div className="flex-1 overflow-y-auto bg-background transition-colors duration-500 pt-24">
                    {children}
                </div>
            </div>
            
        </div>
    );
}