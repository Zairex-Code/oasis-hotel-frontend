"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Building2, Search, ArrowRight, User as UserIcon } from "lucide-react";

export default function PublicHomePage() {
  const { user, logout } = useAuth();
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicHotels = async () => {
      try {
        // Fetch public catalog without needing JWT token
        const response = await api.get("/hotels?size=6&sort=stars,desc");
        setFeaturedHotels(response.data.content || response.data || []);
      } catch (error) {
        console.error("Failed to load public hotel catalog", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicHotels();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* 1. PUBLIC NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-zinc-900">Oasis Hotel</span>
          </div>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-600 hidden sm:inline-block">
                  Welcome back, {user.firstName}
                </span>
                <Link href={['ADMIN', 'HOTEL_MANAGER'].includes(user.role) ? "/admin" : "/dashboard"}>
                  <Button variant="outline" className="gap-2 border-zinc-200">
                    <UserIcon className="w-4 h-4" /> My Account
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">Create Account</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative w-full py-20 md:py-32 lg:py-40 bg-zinc-900 flex items-center justify-center overflow-hidden">
        {/* Absolute Background Image (Placeholder) */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?q=80&w=2000&auto=format&fit=crop" 
            alt="Luxury Hotel" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 container mx-auto max-w-4xl px-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Oasis</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto font-light">
            Experience luxury and comfort across our worldwide network of premium hotels and resorts. Your next adventure starts here.
          </p>
          
          {/* Quick Search Mockup */}
          <div className="max-w-2xl mx-auto bg-white p-2 rounded-full flex items-center shadow-xl">
            <div className="flex-1 flex items-center px-4 gap-3 border-r border-zinc-200">
              <MapPin className="w-5 h-5 text-zinc-400" />
              <input type="text" placeholder="Where are you going?" className="w-full border-none focus:ring-0 outline-none text-zinc-900 placeholder:text-zinc-400 bg-transparent" />
            </div>
            <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 px-8">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </div>
        </div>
      </section>

      {/* 3. FEATURED HOTELS CATALOG */}
      <section className="py-20 bg-zinc-50 flex-1">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Featured Destinations</h2>
              <p className="text-zinc-500 mt-2">Explore our top-rated locations worldwide.</p>
            </div>
            <Button variant="link" className="text-blue-600 hover:text-blue-700 hidden sm:flex">
              View all hotels <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="h-[400px] rounded-xl bg-zinc-200 animate-pulse"></div>
              ))}
            </div>
          ) : featuredHotels.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900">No hotels found</h3>
              <p className="text-zinc-500 mt-1">Our catalog is currently being updated.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredHotels.map((hotel) => (
                <Card key={hotel.id} className="group overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="relative h-64 overflow-hidden bg-zinc-100">
                    {hotel.imageUrl ? (
                      <img 
                        src={hotel.imageUrl} 
                        alt={hotel.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-zinc-300" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-zinc-900">{hotel.stars}.0</span>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 truncate pr-4">{hotel.name}</h3>
                        <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {hotel.city}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-6">
                      View Availability
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. SIMPLE FOOTER */}
      <footer className="bg-white border-t border-zinc-200 py-8">
        <div className="container mx-auto max-w-7xl px-6 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 text-zinc-400 mb-4">
            <Building2 className="w-5 h-5" />
            <span className="font-bold tracking-tight">Oasis Hotel</span>
          </div>
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Oasis Hotel & Resorts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}