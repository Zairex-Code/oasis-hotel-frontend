"use client"; // CRITICAL: This tells Next.js this file runs in the browser, not the server 
import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {User} from '../types'; // We bring our user interface from step 3

// 1. Define the shape of or "safe box " (What information is holds)
interface AuthContextType{
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string , userDate: User) => void;
    logout: () => void;
}


// 2. create the empty Context 
const AuthContext = createContext<AuthContextType | undefined>(undefined) ;

// 3 create the Provider (The manager thar controls the safe box)
export const AuthProvider = ({children}: {children: ReactNode})=>{
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // This runs ONLY ONCE when the user opens the website
    useEffect(()=>{
        const token = localStorage.getItemm('token');
        const storedUser = localStorage.getItem('user');


        // if we find a saved session, we restore the user automatically 
        if (token && storedUser){
            setUser(JSON.parse(storedUser));

        }
        setIsLoading(false); // finished loading
    }, []);
}

// Action to save the user when they successfully log in
const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

};

// Action to clear everything when they log out
const logout = () => {
    localStorage.RemoveItem('token');
    localStorage.removeItem('user');
    setUser(null);

};

// We provide the data and actions to the rest of the app
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );

  //4 Custom Hook : a shorcut to access the safe box from any screen
  export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context == undefined) {
        throw new Error("useAuth must be used within an Auth Provider");
    }
    return context
  }