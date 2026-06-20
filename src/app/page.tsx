"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { MapPin, Star, ArrowRight, User as UserIcon, Sun, Moon } from "lucide-react";

export default function PublicHomePage() {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      {/* 1. NAVBAR ESTILO GLASSMORPHISM COMPACTO (ROUNDED-MD) */}
      <header className="fixed top-0 z-50 w-full border-b border-border/20 bg-background/50 backdrop-blur-md transition-all duration-300 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* LOGO DE PALMERAS DEL SPRINT 4 */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]">
              <img src="/logo.png" alt="Oasis" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-serif font-black tracking-[0.2em] uppercase text-[#D4AF37]">
              Oasis
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            {/* INTERRUPTOR DE LUZ */}
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <nav className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href={['ADMIN', 'HOTEL_MANAGER'].includes(user.role) ? "/admin/hotels" : "/dashboard"}>
                    <Button variant="outline" className="gap-2 rounded-md border-border/50 bg-background/30 hover:bg-accent backdrop-blur-sm px-6 transition-all shadow-sm font-bold">
                      <UserIcon className="w-4 h-4" /> Workspace
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-destructive rounded-md transition-all font-bold">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <Button variant="ghost" className="rounded-md font-bold hidden md:inline-flex hover:bg-accent/50 transition-all">Log In</Button>
                  </Link>
                  <Link href="/login">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-md px-8 shadow-xl hover:-translate-y-0.5 transition-all">
                      Discover
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION CON FONDO FOTOGRÁFICO DE VACACIONES */}
      <section className="relative w-full h-[95vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2062&auto=format&fit=crop" 
            alt="Luxury Tropical Resort" 
            className="w-full h-full object-cover transform scale-105"
          />
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center mt-20">
          <p className="text-sm md:text-base font-black tracking-[0.4em] uppercase text-white/90 mb-6 drop-shadow-md animate-in slide-in-from-bottom-4 duration-700">
            A Piece of Paradise
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-serif font-black tracking-widest text-[#D4AF37] leading-[0.9] drop-shadow-2xl animate-in slide-in-from-bottom-6 duration-1000 uppercase">
            Oasis.
          </h1>
          <p className="mt-8 text-lg md:text-2xl text-white/90 max-w-2xl font-medium drop-shadow-lg animate-in slide-in-from-bottom-8 duration-1000 delay-150">
            Escape the ordinary. Experience world-class hospitality in the most breathtaking destinations on Earth.
          </p>
          
          {/* Redirección automática hacia el control seguro */}
          <Link href="/login">
            <Button size="lg" className="mt-12 rounded-md bg-white text-black hover:bg-zinc-200 font-bold px-10 py-6 text-base shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 group">
              Start Your Journey <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. CATALOGO CON INTERACCIONES DE ALTO IMPACTO (ROUNDED-MD) */}
      <section className="py-32 bg-background relative z-20">
        <div className="container mx-auto px-6 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-foreground">Curated Retreats.</h2>
              <p className="text-muted-foreground mt-4 text-lg font-medium">Our exclusive portfolio of premium properties, handpicked for you.</p>
            </div>
            <Link href="/login">
              <Button variant="ghost" className="rounded-md font-black group cursor-pointer hover:bg-accent/50 transition-all text-sm uppercase tracking-wider">
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
            <div className="text-center py-32 bg-card/20 backdrop-blur-md rounded-md border border-border/50 shadow-sm">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-6 opacity-40"><img src="/logo.png" alt="Oasis" className="w-full h-full object-contain" /></div>
              <h3 className="text-2xl font-black tracking-tight">The Vault is Empty</h3>
              <p className="text-muted-foreground mt-2 font-medium">Our curators are currently preparing the next collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {featuredHotels.map((hotel) => (
                /* 🚀 ENLACE VIVO: Clicar en cualquier tarjeta te lleva a la consola corporativa segura */
                <Link 
                  key={hotel.id} 
                  href="/login"
                  className="group cursor-pointer flex flex-col gap-4 relative"
                >
                  <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-card/30 backdrop-blur-md border border-border/40 shadow-md hover:shadow-xl dark:hover:ring-1 dark:hover:ring-white/10 hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col">
                    
                    <div className="h-[65%] relative overflow-hidden">
                        {hotel.imageUrl ? (
                        <img 
                            src={hotel.imageUrl} 
                            alt={hotel.name} 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
                        />
                        ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground/30 font-bold">No Image Available</div>
                        )}
                        <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-border/30 flex items-center gap-1 shadow-sm">
                            <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                            <span className="text-xs font-black tracking-wider">{hotel.stars}.0</span>
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-t from-background/70 to-transparent">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1">{hotel.name}</h3>
                            <p className="text-muted-foreground flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-widest mt-2">
                                <MapPin className="w-3.5 h-3.5 text-primary" /> {hotel.city}
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-black uppercase tracking-wider text-primary group-hover:translate-x-1 transition-transform">
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

      {/* FOOTER */}
      <footer className="bg-background border-t border-border/40 py-16 mt-auto">
        <div className="container mx-auto px-6 text-center flex flex-col items-center">
          <div className="w-10 h-10 flex items-center justify-center mb-6 filter drop-shadow-[0_2px_6px_rgba(212,175,55,0.2)]">
            <img src="/logo.png" alt="Oasis" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-serif font-black tracking-widest uppercase mb-4 text-[#D4AF37]">Oasis.</h2>
          <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} OASIS HOSPITALITY GROUP. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}