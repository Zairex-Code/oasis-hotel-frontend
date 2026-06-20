"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Endpoint to your Spring Boot AuthController
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      
      // Save session context
      login(token, user);
      
      // Route based on clearance level
      if (user.role === "ADMIN" || user.role === "HOTEL_MANAGER") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid credentials. Please verify your email and password.");
      } else {
        setError("Secure connection failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
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
        {/* Deep blur and gradient for extreme legibility */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50"></div>
      </div>

      {/* FLOATING GLASSMORPHISM AUTH CARD */}
      <div className="relative z-10 w-full max-w-[420px] p-6 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 space-y-4">
            <div className="w-14 h-14 bg-foreground rounded-xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-6 h-6 text-background" />
            </div>
            <div className="text-center">
                <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Oasis.</h1>
                <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Network Identity</p>
            </div>
        </div>

        {/* The Card */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Top highlight bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-chart-2 to-primary opacity-80"></div>
          
          <div className="p-8">
            <h2 className="text-xl font-bold tracking-tight mb-6">Welcome Back</h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Mail Routing</Label>
                <div className="relative group">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="operator@oasis.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 bg-background/50 border-border/50 focus:bg-background focus:border-primary transition-all rounded-xl shadow-inner text-sm font-medium"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Secure Passphrase</Label>
                    <Link href="#" className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">
                        Reset Key?
                    </Link>
                </div>
                <div className="relative group">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-12 bg-background/50 border-border/50 focus:bg-background focus:border-primary transition-all rounded-xl shadow-inner text-sm font-bold tracking-widest"
                    />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full h-12 mt-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                {isLoading ? (
                  <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Clearance... </>
                ) : (
                  <> Initialize Session <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /> </>
                )}
              </Button>

            </form>
          </div>
        </div>

        {/* Footer Navigation */}
        <p className="text-center mt-8 text-sm font-medium text-muted-foreground">
            Not part of the ecosystem?{" "}
            <Link href="/register" className="font-bold text-foreground hover:text-primary transition-colors">
                Request Access
            </Link>
        </p>

      </div>
    </div>
  );
}