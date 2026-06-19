"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter  } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage(){
    const { login } = useAuth(); // We open the safe box to use the 'login' action
    const router = useRouter(); // Tool to redirect the user to another page

    // UI States for better User Experience
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLoginAction = async (formData: FormData) => {

        setIsLoading(true);
        setErrorMessage(null); //  Clear previous errors


        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            // Send the POST request to spring boot

            const response = await api.post('/auth/login', {
                email, password
            });

            console.log("Respuesta exacta de Java:", response.data);

            
            // Extract the data from Java's response
            const {jwt: token, user} = response.data;

            // save it  securely in our Goal context and LocalStorage
            login(token, user);

            // Success! Redirect the user to the admin Dashboard
            router.push('/admin');



        } catch (error: any) {
            console.error("Login failed:", error);
            // Catch the 401 Unauthorized error from spring security
            setErrorMessage(
                error.response?.data?.message || "Invalid email or password. please try again."
            );
        } finally {
            setIsLoading(false); // Stop loading state regardless of success or failure
        }
        
    };

    return (
        
    <div className = "flex items-center justify-center min-h-screen bg-zinc-50">
            <Card  className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">
                        Oasis Hotel Admin
                    </CardTitle>
                    <CardDescription className= "text-center">
                        Enter your email and password to sign in
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleLoginAction} className="space-y-4" >
                        {errorMessage && (
                            <div className= "p-3 text-sm text-red-500 bg-red-100 rounded-md">
                                {errorMessage}
                            </div>
                        )}
                        <div className="space-y-2">

                            <Label htmlFor="email">Email</Label>
                            <Input 
                            id="email"
                            name="email"
                            type="email"
                            placeholder="yourUser@oasishotel.com"
                            required
                            />        
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input 
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

    </div>)

}

