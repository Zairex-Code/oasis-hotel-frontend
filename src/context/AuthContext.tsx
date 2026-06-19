"use client"; // CRITICAL: This tells Next.js this file runs in the browser, not the server

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types'; // We bring our User interface from Step 3

// 1. Define the shape of our "safe box" (What information it holds)
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

// 2. Create the empty Context (The actual safe box)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider (The manager that controls the safe box)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // This runs ONLY ONCE when the user opens the website
    useEffect(() => {
        // We encapsulate the session restoration logic inside a separate function
        const restoreSession = () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        //  Check if storedUser exists and is not the literal string "undefined"
        if (token && storedUser && storedUser !== "undefined") {
            try {
            setUser(JSON.parse(storedUser));
            } catch (error) {
            console.error("Corrupted user data in LocalStorage. Cleaning session.", error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            }
        } else if (storedUser === "undefined") {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        
        setIsLoading(false); // Finished loading data
        };

        // Defer execution to the next event loop tick using setTimeout.
        // This breaks the synchronous chain and completely prevents cascading renders.
        const timeoutId = setTimeout(restoreSession, 0);

        // If the component unmounts unexpectedly, we cancel the timeout to prevent memory leaks. 
        return () => clearTimeout(timeoutId);
    }, []);


    // Action to save the user when they successfully log in
    const login = (token: string, userData: User) => {
        // 1. Persist in LocalStorage for client-side state and Axios instance
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 2. Persist in a secure cookie for server-side Middleware validation (1-day expiration)
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
        
        setUser(userData);
    };

    // Action to clear everything when they log out
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear the session cookie by forcing expiration
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
        
        setUser(null);
    };

    // We provide the data and actions to the rest of the app
    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
};

// 4. Custom Hook: A shortcut to access the safe box from any screen
export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
};