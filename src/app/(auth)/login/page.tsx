/**
 * @file page.tsx (Login)
 * @description Enterprise authentication gateway.
 * Implements a Glassmorphism UI, handles credentials mapping against the Spring Boot auth endpoint,
 * and controls synchronization between React Context, LocalStorage, and Next.js Middleware.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Orchestrates the authentication lifecycle.
   * @param e FormEvent to prevent default browser reload.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Dispatch authentication payload to Spring Boot backend
      const response = await api.post("/auth/login", { email, password });
      
      // 2. JWT MAPPING FAULT-TOLERANCE: Extracts token resolving potential backend DTO variations (jwt vs token)
      const token = response.data?.jwt || response.data?.token || response.data?.accessToken;
      const user = response.data?.user;

      if (!token) {
        throw new Error("Security signature (JWT) missing in backend response payload.");
      }
      
      // 3. Persist session state across Context, LocalStorage, and HTTP Cookies
      login(token, user);
      setIsSuccess(true);
      
      // 4. RACE-CONDITION PREVENTION: Instead of soft-routing via next/router, 
      // we force a hard window reload. This ensures the Next.js Middleware and Axios
      // interceptors natively capture the newly injected HTTP Cookies before fetching protected data.
      setTimeout(() => {
        if (user.role === "ADMIN" || user.role === "HOTEL_MANAGER") {
            window.location.href = "/admin/hotels";
        } else {
            window.location.href = "/dashboard";
        }
      }, 400);

    } catch (err: any) {
      setIsLoading(false);
      console.error("Authentication mapping fault:", err);
      if (err.response?.status === 401) {
        setError("Invalid credentials. Please verify your email and password.");
      } else {
        setError(err.message || "Secure connection failed. Please try again later.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background text-foreground font-sans">
      
      {/* IMMERSIVE BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop" 
            alt="Luxury Architecture" 
            className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50"></div>
      </div>

      {/* FLOATING GLASSMORPHISM AUTH CARD */}
      <div className="relative z-10 w-full max-w-[420px] p-6 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Brand Header (Con tu Logo y tipografía fina de lujo) */}
        <div className="flex flex-col items-center mb-8 space-y-3">
            <div className="w-16 h-16 flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
              <img src="/logo.png" alt="Oasis Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
                <h1 className="text-3xl font-serif font-black tracking-[0.2em] uppercase mb-1 text-[#D4AF37]">Oasis.</h1>
                <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Network Identity Clearance</p>
            </div>
        </div>

        {/* The Card */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-md shadow-2xl overflow-hidden relative">
          <div className="h-1 w-full bg-gradient-to-r from-[#D4AF37] via-primary to-[#D4AF37] opacity-80"></div>
          
          <div className="p-8">
            <h2 className="text-lg font-bold tracking-tight mb-6">System Authentication</h2>

            {error && (
              <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-start gap-2 animate-in fade-in duration-200">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Mail Routing</Label>
                <div className="relative group">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        id="email" type="email" placeholder="operator@oasis.com" 
                        value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="pl-10 h-11 bg-background/40 border-border/50 focus:bg-background/80 focus:border-primary transition-all rounded-md text-sm font-medium shadow-inner"
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Secure Passphrase</Label>
                    <Link href="#" className="text-[9px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">
                        Reset Key?
                    </Link>
                </div>
                <div className="relative group">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        id="password" type="password" placeholder="••••••••" 
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="pl-10 h-11 bg-background/40 border-border/50 focus:bg-background/80 focus:border-primary transition-all rounded-md text-sm font-bold tracking-widest"
                    />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || isSuccess} 
                className="w-full h-11 mt-4 rounded-md font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group cursor-pointer"
              >
                {isLoading ? (
                  <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Clearance... </>
                ) : isSuccess ? (
                  <> Access Granted, Redirecting... </>
                ) : (
                  <> Initialize Session <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /> </>
                )}
              </Button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}