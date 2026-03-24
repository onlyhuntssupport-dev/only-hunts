"use client";

import { useEffect, useState } from "react";
import { getAdmins, deleteAdminAccount } from "@/app/actions/users";
import { Shield, Trash2, Loader2, UserPlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    const result = await getAdmins();
    if (result.success) setAdmins(result.data as AdminUser[]);
    setLoading(false);
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleDelete = async (admin: AdminUser) => {
    const confirmed = window.confirm(`WARNING: This will permanently delete ${admin.name || admin.email} from both the database and the login system. This cannot be undone. Proceed?`);
    
    if (confirmed) {
      setDeletingId(admin.id);
      const result = await deleteAdminAccount(admin.id);
      if (result.success) {
        setAdmins(prev => prev.filter(a => a.id !== admin.id));
      } else {
        alert("Error: " + result.error);
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Admins</h1>
          <p className="text-muted-foreground mt-2">Manage Only-Hunts staff and security permissions.</p>
        </div>
        <Button className="gap-2 bg-amber-800 hover:bg-amber-900 text-white">
          <UserPlus className="h-4 w-4" /> Add Admin
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="h-12 px-4 text-left font-medium">Name</th>
              <th className="h-12 px-4 text-left font-medium">Role</th>
              <th className="h-12 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
            ) : admins.map((admin) => (
              <tr key={admin.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="font-medium">{admin.name || "N/A"}</div>
                  <div className="text-xs text-muted-foreground">{admin.email}</div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold uppercase">
                    <Shield className="h-3 w-3" /> {admin.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(admin)}
                    disabled={deletingId === admin.id}
                  >
                    {deletingId === admin.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Security Note:</strong> Deleting an admin account immediately revokes their dashboard access. They will be logged out upon their next page transition.
        </p>
      </div>
    </div>
  );
}