"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = async (pageToFetch: number = 0) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/users?page=${pageToFetch}`); 
      if (response.data?.content) {
        setUsers(response.data.content);
        setTotalPages(response.data.totalPages || 1);
        setTotalElements(response.data.totalElements || response.data.content.length);
      }
    } catch (err) { setError("Could not load identities."); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(currentPage); }, [currentPage]);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    try {
      const payload = {
        firstName: formData.get("firstName"), lastName: formData.get("lastName"),
        email: formData.get("email"), password: formData.get("password"), role: selectedRole, 
      };
      await api.post("/users", payload);
      setIsCreateModalOpen(false);
      fetchUsers(currentPage); 
    } catch (err: any) {
      alert("Failed to inject user entity. Review backend logs.");
    } finally { setIsCreating(false); }
  };

  return (
    <div className="p-8 space-y-6 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
             <Users className="w-8 h-8 text-primary" /> Identities
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage global ecosystem access and roles.</p>
        </div>
        
        {currentUser?.role === 'ADMIN' && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 rounded-xl font-bold shadow-md shadow-primary/20">
                <Plus className="w-4 h-4" /> Register Identity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Network Identity</DialogTitle>
                <DialogDescription>Create a new profile bound to the RBAC engine.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>First Name</Label><Input name="firstName" required className="rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Last Name</Label><Input name="lastName" required className="rounded-xl" /></div>
                </div>
                <div className="space-y-1.5"><Label>Email Coordinate</Label><Input name="email" type="email" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Temporary Password</Label><Input name="password" type="password" required className="rounded-xl" /></div>
                <div className="space-y-1.5">
                  <Label>System Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Client (Customer)</SelectItem>
                      <SelectItem value="HOTEL_MANAGER">Branch Manager</SelectItem>
                      <SelectItem value="ADMIN">System Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-6 rounded-xl font-bold" disabled={isCreating}>{isCreating ? "Processing..." : "Generate Identity"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* DATA TABLE WRAPPER */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground animate-pulse font-bold flex-1">Syncing identities...</div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Entity Profile</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Email Identity</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Security Clearance</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Commands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-xs uppercase border border-primary/20">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <span className="font-bold text-foreground">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-black border ${
                        user.role === 'ADMIN' ? 'bg-chart-1/10 text-chart-1 border-chart-1/20' : 
                        user.role === 'HOTEL_MANAGER' ? 'bg-chart-2/10 text-chart-2 border-chart-2/20' : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {currentUser?.role === 'ADMIN' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-xl"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl bg-card border-border">
                            <DropdownMenuLabel>Scope Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="rounded-lg"><Edit className="mr-2 h-4 w-4" /> Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive rounded-lg"><Trash2 className="mr-2 h-4 w-4" /> Revoke Access</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-card border rounded-2xl shadow-sm border-border mt-auto">
            <span className="text-sm text-muted-foreground font-medium">
              Page <span className="font-bold text-foreground">{currentPage + 1}</span> of <span className="font-bold text-foreground">{totalPages}</span> ({totalElements} total objects)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="rounded-xl font-bold"><ChevronLeft className="w-4 h-4" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="rounded-xl font-bold">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}