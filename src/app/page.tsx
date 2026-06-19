"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { MapPin, Star, ArrowRight, User as UserIcon, Sun, Moon, Sparkles } from "lucide-react";

export default function PublicHomePage() {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicHotels = async () => {
      try {
        // Fetch top rated hotels for the boutique showcase
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
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">
              Oasis
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* THEME TOGGLE SWITCH */}
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <nav className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href={['ADMIN', 'HOTEL_MANAGER'].includes(user.role) ? "/admin" : "/dashboard"}>
                    <Button variant="outline" className="gap-2 rounded-full border-border bg-transparent hover:bg-accent backdrop-blur-sm px-6">
                      <UserIcon className="w-4 h-4" /> Console
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-destructive rounded-full">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <Button variant="ghost" className="rounded-full font-semibold hidden md:inline-flex">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-foreground hover:bg-foreground/90 text-background font-bold rounded-full px-8 shadow-2xl">
                      Book Now
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 2. IMMERSIVE HERO SECTION (Edge-to-Edge) */}
      <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Deep, immersive background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?q=80&w=2000&auto=format&fit=crop" 
            alt="Luxury Resort" 
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient overlay to ensure text readability on both light/dark modes */}
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center mt-20">
          <p className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-white/80 mb-6 drop-shadow-md">
            The Evasion Collection
          </p>
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-white leading-none drop-shadow-2xl">
            ESCAPE.
          </h1>
          <p className="mt-8 text-lg md:text-2xl text-white/90 max-w-2xl font-medium drop-shadow-lg">
            Discover a curated selection of architectural masterpieces designed for the modern traveler.
          </p>
          
          <Button size="lg" className="mt-12 rounded-full bg-white text-black hover:bg-zinc-200 font-bold px-10 py-7 text-lg shadow-2xl">
            Explore Destinations <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* 3. MINIMALIST CATALOG (Boutique Grid) */}
      <section className="py-32 bg-background relative z-20">
        <div className="container mx-auto px-6 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Curated Spaces.</h2>
              <p className="text-muted-foreground mt-4 text-lg">Handpicked environments where design meets absolute tranquility.</p>
            </div>
            <Button variant="ghost" className="rounded-full font-bold group">
              View Collection <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="aspect-[3/4] rounded-3xl bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : featuredHotels.length === 0 ? (
            <div className="text-center py-32 bg-accent/30 rounded-3xl border border-border/50">
              <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-6" />
              <h3 className="text-2xl font-black tracking-tight">The Vault is Empty</h3>
              <p className="text-muted-foreground mt-2">Our curators are currently preparing the next collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {featuredHotels.map((hotel) => (
                <div key={hotel.id} className="group cursor-pointer flex flex-col gap-4">
                  {/* Clean, borderless image container for the Evasion look */}
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
                    {hotel.imageUrl ? (
                      <img 
                        src={hotel.imageUrl} 
                        alt={hotel.name} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        No Image
                      </div>
                    )}
                    
                    {/* Floating Rating Badge */}
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <Star className="w-3.5 h-3.5 text-foreground fill-foreground" />
                      <span className="text-xs font-black tracking-wider">{hotel.stars}.0</span>
                    </div>
                  </div>
                  
                  {/* Typography-driven details */}
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{hotel.name}</h3>
                    <p className="text-muted-foreground flex items-center gap-1.5 font-medium uppercase text-xs tracking-widest">
                      <MapPin className="w-3.5 h-3.5" /> {hotel.city}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. MINIMALIST FOOTER */}
      <footer className="bg-background border-t border-border/50 py-20 mt-auto">
        <div className="container mx-auto px-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mb-6">
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