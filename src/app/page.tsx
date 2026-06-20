/**
 * @file page.tsx (Public Landing Page)
 * @description Public-facing gateway for the Oasis Ecosystem.
 * Serves as the primary entry point for unauthenticated users. Features a dynamic, 
 * glassmorphism-styled UI that conditionally renders navigation based on the user's JWT session state.
 * Fetches and displays a curated list of top-rated branches using a public API endpoint.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { MapPin, Star, ArrowRight, User as UserIcon, Sun, Moon, Sparkles } from "lucide-react";

export default function PublicHomePage() {
  // Global Auth Context Injection
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();
  
  // Local State for Public Catalog
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initializes the public catalog on mount.
   * Requests a sorted list (by stars) of the top 6 branches from the backend.
   */
  useEffect(() => {
    const fetchPublicHotels = async () => {
      try {
        const response = await api.get("/hotels?size=6&sort=stars,desc");
        setFeaturedHotels(response.data.content || response.data || []);
      } catch (error) {
        console.error("Failed to sync public index catalog:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicHotels();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-500 font-sans">
      
      {/* 1. GLASSMORPHISM NAVBAR (Boutique Style) */}
      <header className="fixed top-0 z-50 w-full border-b border-border/20 bg-background/50 backdrop-blur-md transition-all duration-300 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center group-hover:bg-primary transition-colors">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors">
              Oasis
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* THEME TOGGLE SWITCH */}
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <nav className="flex items-center gap-4">
              {/* CONDITIONAL RENDERING: Adjusts navigation based on RBAC clearance */}
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href={['ADMIN', 'HOTEL_MANAGER'].includes(user.role) ? "/admin/hotels" : "/dashboard"}>
                    <Button variant="outline" className="gap-2 rounded-md border-border/50 bg-background/30 hover:bg-accent backdrop-blur-sm px-6 transition-all shadow-sm">
                      <UserIcon className="w-4 h-4" /> Workspace
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-destructive rounded-md transition-all">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <Button variant="ghost" className="rounded-md font-semibold hidden md:inline-flex hover:bg-accent/50 transition-all">Log In</Button>
                  </Link>
                  <Link href="/login">
                    <Button className="bg-foreground hover:bg-foreground/90 text-background font-bold rounded-md px-8 shadow-xl hover:-translate-y-0.5 transition-all">
                      Discover
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 2. IMMERSIVE HERO SECTION (Vacation Vibe) */}
      <section className="relative w-full h-[95vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2062&auto=format&fit=crop" 
            alt="Luxury Tropical Resort" 
            className="w-full h-full object-cover transform scale-105"
          />
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center mt-20">
          <p className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-white/80 mb-6 drop-shadow-md animate-in slide-in-from-bottom-4 duration-700">
            A Piece of Paradise
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tighter text-white leading-[0.9] drop-shadow-2xl animate-in slide-in-from-bottom-6 duration-1000">
            REDEFINE <br className="hidden md:block"/> LUXURY.
          </h1>
          <p className="mt-8 text-lg md:text-2xl text-white/90 max-w-2xl font-medium drop-shadow-lg animate-in slide-in-from-bottom-8 duration-1000 delay-150">
            Escape the ordinary. Experience world-class hospitality in the most breathtaking destinations on Earth.
          </p>
          
          <Link href="/login">
            <Button size="lg" className="mt-12 rounded-md bg-white text-black hover:bg-zinc-200 font-bold px-10 py-7 text-lg shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in duration-1000 delay-300 group">
              Start Your Journey <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. MINIMALIST GLASSMORPHISM CATALOG */}
      <section className="py-32 bg-background relative z-20">
        <div className="container mx-auto px-6 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Curated Retreats.</h2>
              <p className="text-muted-foreground mt-4 text-lg">Our exclusive portfolio of premium properties, handpicked for you.</p>
            </div>
            <Link href="/login">
              <Button variant="ghost" className="rounded-md font-bold group cursor-pointer hover:bg-accent/50 transition-all">
                Explore Collection <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="aspect-[4/5] rounded-md bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : featuredHotels.length === 0 ? (
            <div className="text-center py-32 bg-accent/20 backdrop-blur-md rounded-md border border-border/50 shadow-sm">
              <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-6" />
              <h3 className="text-2xl font-black tracking-tight">The Vault is Empty</h3>
              <p className="text-muted-foreground mt-2">Our curators are currently preparing the next collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {featuredHotels.map((hotel) => (
                <Link 
                  href="/login"
                  key={hotel.id} 
                  className="group cursor-pointer flex flex-col gap-4 relative"
                >
                  {/* 🚀 GLASSMORPHISM CARD HOVER PHYSICS */}
                  <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-card/40 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col">
                    
                    {/* Image Section */}
                    <div className="h-[65%] relative overflow-hidden">
                        {hotel.imageUrl ? (
                        <img 
                            src={hotel.imageUrl} 
                            alt={hotel.name} 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                        />
                        ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground/30">
                            No Image Available
                        </div>
                        )}
                        <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-border/30 flex items-center gap-1.5 shadow-sm">
                            <Star className="w-3.5 h-3.5 text-foreground fill-foreground" />
                            <span className="text-xs font-black tracking-wider">{hotel.stars}.0</span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1">{hotel.name}</h3>
                            <p className="text-muted-foreground flex items-center gap-1.5 font-medium uppercase text-xs tracking-widest mt-2">
                                <MapPin className="w-3.5 h-3.5 text-primary" /> {hotel.city}
                            </p>
                        </div>
                        <div className="flex items-center text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                            View Availability &rarr;
                        </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. MINIMALIST FOOTER */}
      <footer className="bg-background border-t border-border/50 py-20 mt-auto">
        <div className="container mx-auto px-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-foreground text-background rounded-md flex items-center justify-center mb-6 shadow-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">Oasis.</h2>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            © {new Date().getFullYear()} OASIS HOSPITALITY GROUP. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}