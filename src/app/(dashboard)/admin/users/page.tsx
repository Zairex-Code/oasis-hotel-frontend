"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User, Role } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Users as UsersIcon, Mail, ShieldAlert, MoreVertical, Edit, ShieldCheck } from "lucide-react";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
        setIsLoading(true);
        setError(null);
        const response = await api.get("/users");
        
        // Parse Pageable format from Spring Boot
        let checkedUsers: User[] = [];
        if (response.data) {
            checkedUsers = Array.isArray(response.data) ? response.data : (response.data.content || []);
        }
        setUsers(checkedUsers);
        } catch (err: any) {
        console.error("Error fetching users:", err);
        setError("Could not load user directory from the server.");
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 1. Create a new User (POST)
    const handleCreateUser = async (formData: FormData) => {
        setIsProcessing(true);
        try {
        const newUserData = {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            email: formData.get("email"),
            password: formData.get("password"), // Required by UserRequestDTO
        };

        await api.post("/users", newUserData);
        setIsCreateModalOpen(false);
        fetchUsers(); // Refresh the list
        } catch (err: any) {
        console.error("Error creating user:", err);
        alert(err.response?.data?.message || "Failed to register user.");
        } finally {
        setIsProcessing(false);
        }
    };

    // 2. Update basic info (PUT /users/{id})
    const handleUpdateUser = async (formData: FormData) => {
        if (!userToEdit) return;
        setIsProcessing(true);
        try {
        const updatedData = {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            email: formData.get("email"),
        };

        await api.put(`/users/${userToEdit.id}`, updatedData);
        setIsEditModalOpen(false);
        setUserToEdit(null);
        fetchUsers();
        } catch (err: any) {
        console.error("Error updating user:", err);
        alert(err.response?.data?.message || "Failed to update user profile.");
        } finally {
        setIsProcessing(false);
        }
    };

    // 3. Elevate or Restrict Privileges (PUT /users/set-role/{id})
    const handleRoleChange = async (userId: number, newRole: Role) => {
        const confirmMsg = `Are you sure you want to change this user's role to ${newRole}?`;
        if(!window.confirm(confirmMsg)) return;

        try {
        // Connects directly with the RBAC system in UserController
        await api.put(`/users/set-role/${userId}`, { role: newRole });
        fetchUsers();
        } catch (err: any) {
        console.error("Error changing role:", err);
        alert(err.response?.data?.message || "You don't have permission to modify roles.");
        }
    };

    const openEditModal = (user: User) => {
        setUserToEdit(user);
        setIsEditModalOpen(true);
    };

    // Helper function to render color-coded roles
    const renderRoleBadge = (role: string) => {
        switch (role) {
        case Role.ADMIN: 
            return <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 border border-purple-200 rounded-full shadow-sm">Global Admin</span>;
        case Role.HOTEL_MANAGER: 
            return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 border border-blue-200 rounded-full shadow-sm">Hotel Manager</span>;
        default: 
            return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 border border-green-200 rounded-full shadow-sm">Customer</span>;
        }
    };

    return (
        <div className="p-8 space-y-6">
        
        {/* --- HEADER & CREATION MODAL --- */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">User Directory</h1>
            <p className="text-zinc-500">Manage customers, staff, and system administrators.</p>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Register User</DialogTitle>
                <DialogDescription>New users are assigned the CUSTOMER role by default.</DialogDescription>
                </DialogHeader>
                <form action={handleCreateUser} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" required /></div>
                    <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" name="email" type="email" required /></div>
                <div className="space-y-2"><Label htmlFor="password">Temporary Password</Label><Input id="password" name="password" type="password" required minLength={6} /></div>
                <Button type="submit" className="w-full mt-6" disabled={isProcessing}>
                    {isProcessing ? "Saving to Database..." : "Register User"}
                </Button>
                </form>
            </DialogContent>
            </Dialog>
        </div>

        {/* --- EDIT MODAL --- */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>Update personal information for this user.</DialogDescription>
            </DialogHeader>
            {userToEdit && (
                <form action={handleUpdateUser} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="edit-firstName">First Name</Label><Input id="edit-firstName" name="firstName" defaultValue={userToEdit.firstName} required /></div>
                    <div className="space-y-2"><Label htmlFor="edit-lastName">Last Name</Label><Input id="edit-lastName" name="lastName" defaultValue={userToEdit.lastName} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="edit-email">Email Address</Label><Input id="edit-email" name="email" type="email" defaultValue={userToEdit.email} required /></div>
                <Button type="submit" className="w-full mt-6" disabled={isProcessing}>
                    {isProcessing ? "Updating Profile..." : "Save Changes"}
                </Button>
                </form>
            )}
            </DialogContent>
        </Dialog>

        {/* --- ERROR & LOADING STATES --- */}
        {isLoading && <div className="py-12 text-center text-zinc-500 animate-pulse font-medium">Loading network identities...</div>}
        {error && <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md border border-red-200">{error}</div>}

        {/* --- USERS GRID --- */}
        {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.length === 0 ? (
                <p className="py-12 text-center border-2 border-dashed rounded-lg col-span-full text-zinc-500 font-medium bg-white">
                No users found in the database.
                </p>
            ) : (
                users.map((user) => (
                <Card key={user.id} className="relative overflow-hidden transition-all hover:shadow-md border-l-4 border-l-zinc-800">
                    <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-full">
                            <UsersIcon className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">{user.firstName} {user.lastName}</CardTitle>
                            <div className="mt-1">{renderRoleBadge(user.role)}</div>
                        </div>
                        </div>
                        
                        {/* ADMIN ACTIONS DROPDOWN */}
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs font-semibold text-zinc-400 uppercase">Security Clearance</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, Role.HOTEL_MANAGER)}>
                            <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" /> Promote to Manager
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, Role.ADMIN)}>
                            <ShieldAlert className="mr-2 h-4 w-4 text-purple-600" /> Escalate to Admin
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, Role.CUSTOMER)}>
                            <UsersIcon className="mr-2 h-4 w-4 text-green-600" /> Demote to Customer
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                    </CardHeader>
                    <CardContent>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 truncate">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>{user.email}</span>
                    </div>
                    </CardContent>
                </Card>
                ))
            )}
            </div>
        )}
        </div>
    );
}