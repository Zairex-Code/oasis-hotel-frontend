"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminDashboardPage() {
    // 1. We open our safe box to get the currently logged-in user and the logout action
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    // 2. Action to handle signing out
    const handleSignOut = () => {
        logout(); // Clears LocalStorage and Context
        router.push('/login'); // Sends the user back to the login screen
    };

    // While the context is checking if the user exists in LocalStorage, show a loading state
    if (isLoading) {
        return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50">
            <p className="text-zinc-500 animate-pulse">Loading dashboard...</p>
        </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-zinc-50">
        <div className="max-w-4xl mx-auto space-y-6">
            
        
            <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Admin Dashboard
                </h1>
                <p className="text-zinc-500">
                Welcome back to Oasis Hotel Management System.
                </p>
            </div>
            
            <Button variant="outline" onClick={handleSignOut}>
                Sign Out
            </Button>
            </div>

        
            <Card>
            <CardHeader>
                <CardTitle>Your Profile Profile</CardTitle>
                <CardDescription>Verified information from Spring Boot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
        
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-100">
                <div>
                    <p className="text-sm font-medium text-zinc-500">First Name</p>
                    <p className="text-lg font-semibold">{user?.firstName}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-500">Last Name</p>
                    <p className="text-lg font-semibold">{user?.lastName}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-500">Email Address</p>
                    <p className="text-lg font-semibold">{user?.email}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-500">System Role</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    {user?.role}
                    </span>
                </div>
                </div>
            </CardContent>
            </Card>

        </div>
        </div>
    );
}