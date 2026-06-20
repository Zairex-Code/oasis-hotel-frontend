"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MoreHorizontal, Edit, ShieldAlert, ChevronLeft, ChevronRight, Users, Search, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState("CUSTOMER");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>("CUSTOMER");

  const [filterName, setFilterName] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true);
      let endpoint = `/users?page=${pageToFetch}`;
      if (filterName.trim() !== "") endpoint = `/users/search/name?name=${encodeURIComponent(filterName)}&page=${pageToFetch}`;
      else if (filterRole !== "ALL") endpoint = `/users/search/role?role=${filterRole}&page=${pageToFetch}`;
      const response = await api.get(endpoint); 
      if (response.data?.content) {
        setUsers(response.data.content); setTotalPages(response.data.totalPages || 1); setTotalElements(response.data.totalElements || response.data.content.length);
      } else if (Array.isArray(response.data)) setUsers(response.data);
    } catch (err) { setError("Could not load network identities."); } finally { setIsLoading(false); }
  };

  useEffect(() => { 
    const timer = setTimeout(() => fetchUsers(currentPage), 300); return () => clearTimeout(timer);
  }, [currentPage, filterName, filterRole]);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setIsCreating(true); const formData = new FormData(e.currentTarget);
    try {
      await api.post("/users", { firstName: formData.get("firstName"), lastName: formData.get("lastName"), email: formData.get("email"), password: formData.get("password"), role: selectedRole });
      setIsCreateModalOpen(false); fetchUsers(currentPage); 
    } catch (err) { alert("Failed to inject user entity."); } finally { setIsCreating(false); }
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    if (!userToEdit) return; 
    setIsUpdating(true); 
    const formData = new FormData(e.currentTarget);
    
    try {
      // 🚀 ARMAMOS EL PAYLOAD COMPLETO PARA SATISFACER A SPRING BOOT
      const payload = {
        firstName: formData.get("firstName"), 
        lastName: formData.get("lastName"),
        email: userToEdit.email, // 👈 Enviamos el email original porque Java lo exige
        role: currentUser?.role === 'ADMIN' ? editRole : userToEdit.role // 👈 Enviamos el rol modificado aquí mismo
      };

      // Hacemos una única petición con toda la data
      await api.put(`/users/${userToEdit.id}`, payload);
      
      setIsEditModalOpen(false); 
      setUserToEdit(null); 
      fetchUsers(currentPage);
    } catch (err: any) { 
      // 🚀 Mejoramos el error para que nos diga exactamente de qué se queja Java
      console.error("Backend Validation Error:", err.response?.data || err);
      alert(`Backend Error: ${err.response?.data?.message || err.response?.data?.error || 'Revisa la consola (F12)'}`); 
    } finally { 
      setIsUpdating(false); 
    }
  };

  // 🚀 AQUÍ ESTÁ LA FUNCIÓN QUE NEXT.JS DECÍA QUE NO EXISTÍA
  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setEditRole(user.role);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6 gap-4">
        <div><h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3"><Users className="w-8 h-8 text-primary" /> Network Identities</h1><p className="text-muted-foreground font-medium text-sm mt-1">Manage global ecosystem access and role-based permissions.</p></div>
        <div className="flex items-center gap-3">
            {currentUser?.role === 'ADMIN' && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild><Button className="flex items-center gap-2 font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"><Plus className="w-4 h-4" /> Register Identity</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader><DialogTitle>Create Network Identity</DialogTitle><DialogDescription>Create a new profile bound to the RBAC engine.</DialogDescription></DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">First Name</Label><Input name="firstName" required className="bg-background/50 shadow-inner" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Last Name</Label><Input name="lastName" required className="bg-background/50 shadow-inner" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Email Coordinate</Label><Input name="email" type="email" required className="bg-background/50 shadow-inner" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Temporary Password</Label><Input name="password" type="password" required className="bg-background/50 shadow-inner" /></div>
                    <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">System Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="bg-background/50 border-border/50 cursor-pointer"><SelectValue /></SelectTrigger>
                        <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                        <SelectItem value="CUSTOMER" className="cursor-pointer">Client (Customer)</SelectItem>
                        <SelectItem value="HOTEL_MANAGER" className="cursor-pointer">Branch Manager</SelectItem>
                        <SelectItem value="ADMIN" className="cursor-pointer">System Administrator</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <Button type="submit" className="w-full mt-6 font-bold shadow-md cursor-pointer hover:-translate-y-0.5 transition-transform" disabled={isCreating}>{isCreating ? "Processing..." : "Generate Identity"}</Button>
                </form>
                </DialogContent>
            </Dialog>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-card/40 backdrop-blur-md border border-border/50 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/10">
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><Search className="w-3.5 h-3.5 text-primary" /> Filter by Name</Label><Input placeholder="Search user by first or last name..." value={filterName} onChange={(e) => { setFilterRole("ALL"); setFilterName(e.target.value); setCurrentPage(0); }} className="bg-background/50 border-border/50 text-sm h-10 shadow-inner hover:border-primary/50 transition-colors" /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider"><Filter className="w-3.5 h-3.5 text-chart-2" /> Clearance Level</Label><Select value={filterRole} onValueChange={(val) => { setFilterName(""); setFilterRole(val); setCurrentPage(0); }}><SelectTrigger className="bg-background/50 border-border/50 text-sm h-10 cursor-pointer hover:border-primary/50 transition-colors"><SelectValue /></SelectTrigger><SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl"><SelectItem value="ALL" className="cursor-pointer">All Roles</SelectItem><SelectItem value="ADMIN" className="cursor-pointer">Administrators</SelectItem><SelectItem value="HOTEL_MANAGER" className="cursor-pointer">Branch Managers</SelectItem><SelectItem value="CUSTOMER" className="cursor-pointer">Customers</SelectItem></SelectContent></Select></div>
      </div>

      {isLoading ? <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Syncing identities...</div> : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-md shadow-sm overflow-hidden dark:ring-1 dark:ring-white/10">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
                <tr><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Entity Profile</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Email Identity</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Security Clearance</th><th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Commands</th></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {users.length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center font-medium text-muted-foreground">No identities match your search criteria.</td></tr> : (
                    users.map((userObj) => (
                    <tr key={userObj.id} className="hover:bg-accent/20 hover:shadow-sm transition-all group">
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary font-black text-xs uppercase border border-primary/20 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{userObj.firstName?.charAt(0)}{userObj.lastName?.charAt(0)}</div><span className="font-bold text-foreground group-hover:text-primary transition-colors">{userObj.firstName} {userObj.lastName}</span></div></td>
                        <td className="px-6 py-4 text-muted-foreground font-medium">{userObj.email}</td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-md text-[9px] uppercase tracking-widest font-black border shadow-sm ${userObj.role === 'ADMIN' ? 'bg-chart-1/10 text-chart-1 border-chart-1/20' : userObj.role === 'HOTEL_MANAGER' ? 'bg-chart-2/10 text-chart-2 border-chart-2/20' : 'bg-muted/50 text-muted-foreground border-border/50'}`}>{userObj.role}</span></td>
                        <td className="px-6 py-4 text-right">
                        {currentUser?.role === 'ADMIN' && (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50 hover:shadow-md transition-all cursor-pointer"><MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl p-1">
                                <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Scope Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {/* EL LLAMADO A LA FUNCIÓN REPARADO */}
                                <DropdownMenuItem onClick={() => openEditModal(userObj)} className="font-medium cursor-pointer hover:bg-primary/10 transition-colors"><Edit className="mr-2 h-4 w-4 text-primary" /> Edit Profile Details</DropdownMenuItem>
                                {userObj.role !== 'ADMIN' && <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer font-bold mt-1 hover:bg-destructive/10 transition-colors"><ShieldAlert className="mr-2 h-4 w-4" /> Suspend Access</DropdownMenuItem>}
                            </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-md border rounded-md shadow-sm border-border/50 mt-auto dark:ring-1 dark:ring-white/10"><span className="text-sm text-muted-foreground font-medium">Page <span className="font-bold text-foreground">{currentPage + 1}</span> of <span className="font-bold text-foreground">{totalPages}</span> ({totalElements} total objects)</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="font-bold hover:bg-accent/50 cursor-pointer"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="font-bold hover:bg-accent/50 cursor-pointer">Next <ChevronRight className="w-4 h-4 ml-1" /></Button></div></div>
        </div>
      )}

      {/* MODAL DE EDICIÓN ESTILIZADO Y FUNCIONAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader><DialogTitle>Edit Identity Profile</DialogTitle><DialogDescription>Modify personal details or upgrade system clearance.</DialogDescription></DialogHeader>
          {userToEdit && (
            <form onSubmit={handleUpdateUser} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">First Name</Label><Input name="firstName" defaultValue={userToEdit.firstName} required className="bg-background/50 shadow-inner" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Last Name</Label><Input name="lastName" defaultValue={userToEdit.lastName} required className="bg-background/50 shadow-inner" /></div>
              </div>
              <div className="space-y-1.5 opacity-50 cursor-not-allowed"><Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Email Coordinate (Immutable)</Label><Input value={userToEdit.email} readOnly className="bg-background/50 shadow-inner" /></div>
              {currentUser?.role === 'ADMIN' && currentUser.id !== userToEdit.id && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">System Role Clearance</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger className="bg-background/50 border-border/50 cursor-pointer shadow-inner"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                      <SelectItem value="CUSTOMER" className="cursor-pointer">Client (Customer)</SelectItem>
                      <SelectItem value="HOTEL_MANAGER" className="cursor-pointer">Branch Manager</SelectItem>
                      <SelectItem value="ADMIN" className="cursor-pointer">System Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full mt-6 font-bold shadow-md cursor-pointer hover:-translate-y-0.5 transition-transform" disabled={isUpdating}>{isUpdating ? "Mutating identity..." : "Save Profile Updates"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}