"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedRole, setSelectedRole] = useState("CUSTOMER"); // Aligned with Java Role enum default

    const fetchUsers = async () => {
        try {
        setIsLoading(true);
        setError(null);
        const response = await api.get("/users"); 
        
        let checkedUsers: User[] = [];
        if (response.data) {
            if (Array.isArray(response.data)) {
            checkedUsers = response.data;
            } else if (response.data.content && Array.isArray(response.data.content)) {
            checkedUsers = response.data.content;
            }
        }
        setUsers(checkedUsers);
        } catch (err: any) {
        console.error("Error fetching users:", err);
        setError("Could not load users from Spring Boot.");
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreating(true);
        
        const formData = new FormData(e.currentTarget);
        
        try {
        const newUserPayload = {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            email: formData.get("email"),
            password: formData.get("password"),
            role: selectedRole,
        };

        await api.post("/users", newUserPayload);
        
        setIsCreateModalOpen(false);
        setSelectedRole("CUSTOMER");
        fetchUsers(); 
        
        } catch (err: any) {
        console.error("Payload verification error:", err);
        
        // 🚀 ADVANCED DIAGNOSTIC: Parse custom field validation errors from GlobalExceptionHandler.java
        if (err.response?.data?.errors) {
            const validationMap = err.response.data.errors;
            const errorMessages = Object.entries(validationMap)
            .map(([field, msg]) => `• ${field}: ${msg}`)
            .join("\n");
            
            alert(`Validation Failed:\n${errorMessages}`);
        } else {
            alert(err.response?.data?.detail || "Failed to register user rows inside the database.");
        }
        } finally {
        setIsCreating(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">System Users</h1>
            <p className="text-zinc-500">Manage administrators, receptionists, and clients.</p>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New User
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Register New User</DialogTitle>
                <DialogDescription>
                    Create a new identity for the Oasis Hotel platform.
                </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" placeholder="Dylan" required minLength={3} maxLength={30} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" placeholder="Zairex" required minLength={3} maxLength={30} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="dylan@oasishotel.com" required maxLength={30} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} maxLength={50} />
                </div>

                <div className="space-y-2">
                    <Label>System Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Aligned values matching com.oasis_hotel.oasis_hotel.entity.enums.Role */}
                        <SelectItem value="CUSTOMER">Customer (Client)</SelectItem>
                        <SelectItem value="HOTEL_MANAGER">Hotel Manager</SelectItem>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                
                <Button type="submit" className="w-full mt-6" disabled={isCreating}>
                    {isCreating ? "Saving to database..." : "Create User"}
                </Button>
                </form>
            </DialogContent>
            </Dialog>
        </div>

        {isLoading && <div className="py-12 text-center text-zinc-500 animate-pulse">Loading users...</div>}
        {error && <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">{error}</div>}

        {!isLoading && !error && (
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden border-zinc-200">
            <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                    <th className="px-6 py-4 font-medium">Full Name</th>
                    <th className="px-6 py-4 font-medium">Email Address</th>
                    <th className="px-6 py-4 font-medium">System Role</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
                </thead>
                
                <tbody className="divide-y divide-zinc-200">
                {Array.isArray(users) && users.length === 0 ? (
                    <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                        No users found in the database.
                    </td>
                    </tr>
                ) : (
                    Array.isArray(users) && users.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                            <span className="font-medium text-zinc-900">
                            {user.firstName} {user.lastName}
                            </span>
                        </div>
                        </td>

                        <td className="px-6 py-4 text-zinc-500">
                        {user.email}
                        </td>

                        <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'HOTEL_MANAGER' ? 'bg-orange-100 text-orange-800' : 
                            'bg-zinc-100 text-zinc-800'
                        }`}>
                            {user.role}
                        </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>User Options</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => alert("Edit feature coming next!")}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Suspend Account
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        )}
        </div>
    );
}