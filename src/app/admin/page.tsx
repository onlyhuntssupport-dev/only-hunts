"use client";

import { useEffect, useState } from "react";
import { getAdmins } from "@/app/actions/users";
import { Loader2, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  [key: string]: any;
}

const getRoleBadge = (role: string = "ADMIN") => {
  const r = role.toUpperCase();
  if (r === "SUPER_ADMIN" || r === "SUPERADMIN") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 px-2.5 py-1 text-xs font-black text-orange-700 dark:text-orange-400 shadow-sm uppercase tracking-widest transition-colors">
        <ShieldAlert className="h-3.5 w-3.5" /> Super Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-kalahari/20 dark:bg-kalahari/10 border border-kalahari/30 dark:border-kalahari/20 px-2.5 py-1 text-xs font-black text-olive dark:text-kalahari shadow-sm uppercase tracking-widest transition-colors">
      <ShieldCheck className="h-3.5 w-3.5" /> Admin
    </span>
  );
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdmins() {
      try {
        setLoading(true);
        const result = await getAdmins();
        if (result.success && result.data) {
          setAdmins(result.data as AdminUser[]);
        } else {
          setError(result.error || "Permission Denied. Failed to load admins.");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    loadAdmins();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-off-white dark:bg-olive pt-12 px-4 sm:px-6 lg:px-8 pb-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-kalahari/20 dark:border-kalahari/30 pb-6 transition-colors">
          <div>
            <h1 className="text-3xl font-black font-headline text-olive dark:text-off-white tracking-tight transition-colors">Internal Team</h1>
            <p className="text-olive/70 dark:text-off-white/60 mt-2 font-medium transition-colors">Manage Only-Hunts staff and admin privileges.</p>
          </div>
          <Button className="gap-2 bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive font-bold shadow-md transition-all">
            <Shield className="h-4 w-4" /> Add Team Member
          </Button>
        </div>

        {/* DATA TABLE */}
        <div className="rounded-2xl border-2 border-kalahari/20 dark:border-kalahari/30 bg-white dark:bg-black/30 shadow-sm overflow-hidden transition-colors">
          <div className="relative w-full overflow-auto min-h-[300px]">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-kalahari/10 dark:bg-black/40 transition-colors">
                <tr className="border-b-2 border-kalahari/20 dark:border-kalahari/30 transition-colors">
                  <th className="h-14 px-6 text-left font-black text-olive dark:text-kalahari uppercase tracking-wider text-xs">Name</th>
                  <th className="h-14 px-6 text-left font-black text-olive dark:text-kalahari uppercase tracking-wider text-xs">Email</th>
                  <th className="h-14 px-6 text-left font-black text-olive dark:text-kalahari uppercase tracking-wider text-xs">Access Level</th>
                  <th className="h-14 px-6 text-left font-black text-olive dark:text-kalahari uppercase tracking-wider text-xs">Added</th>
                  <th className="h-14 px-6 text-right font-black text-olive dark:text-kalahari uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kalahari/10 dark:divide-kalahari/20">
                {loading && (
                  <tr>
                    <td colSpan={5} className="h-48 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-kalahari" /> 
                      <span className="text-olive dark:text-off-white/70 font-bold transition-colors">Loading team...</span>
                    </td>
                  </tr>
                )}
                
                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="h-48 text-center">
                      <div className="bg-red-50 dark:bg-red-900/20 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 transition-colors">
                        <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-500" />
                        <span className="text-red-700 dark:text-red-400 font-bold">{error}</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {!loading && !error && admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="h-48 text-center text-olive/60 dark:text-off-white/50 font-bold transition-colors">
                      No admins found.
                    </td>
                  </tr>
                )}
                
                {!loading && !error && admins.map((admin) => (
                  <tr key={admin.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="p-6 align-middle font-black text-olive dark:text-off-white flex items-center gap-3 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-kalahari/20 dark:bg-kalahari/10 flex items-center justify-center text-olive dark:text-kalahari shrink-0">
                        <Shield className="h-4 w-4" />
                      </div>
                      {admin.name || "N/A"}
                    </td>
                    <td className="p-6 align-middle text-olive/80 dark:text-off-white/80 font-medium transition-colors">{admin.email}</td>
                    <td className="p-6 align-middle">{getRoleBadge(admin.role)}</td>
                    <td className="p-6 align-middle text-olive/60 dark:text-off-white/50 font-bold transition-colors">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "Unknown"}
                    </td>
                    <td className="p-6 align-middle text-right">
                      <Button variant="outline" size="sm" className="border-kalahari text-olive dark:text-off-white hover:bg-kalahari/10 dark:hover:bg-kalahari/20 font-bold transition-colors">
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}