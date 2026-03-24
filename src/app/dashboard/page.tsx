"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/app/actions/dashboard";
import { BarChart3, Clock, CheckCircle, DollarSign, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stats {
  totalHunts: number;
  pendingHunts: number;
  approvedHunts: number;
  totalValue: number;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await getDashboardStats();
        if (res.success) setStats(res.data as Stats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-800 h-10 w-10" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">DASHBOARD OVERVIEW</h1>
        <p className="text-stone-500 mt-1">System KPIs and quick actions for the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Total Listings</h3>
            <BarChart3 className="h-5 w-5 text-amber-800" />
          </div>
          <p className="text-4xl font-black text-stone-900">{stats?.totalHunts || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm flex flex-col bg-blue-50/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider">Pending Review</h3>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-4xl font-black text-blue-900">{stats?.pendingHunts || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm flex flex-col bg-emerald-50/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Active Hunts</h3>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-4xl font-black text-emerald-900">{stats?.approvedHunts || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Total Value</h3>
            <DollarSign className="h-5 w-5 text-stone-400" />
          </div>
          <p className="text-4xl font-black text-stone-900">${stats?.totalValue?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-8 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Queue Management</h2>
          <p className="text-stone-500">You have <span className="font-bold text-stone-900">{stats?.pendingHunts || 0}</span> hunts waiting for approval.</p>
        </div>
        <Link href="/dashboard/hunts">
          <Button className="bg-amber-800 hover:bg-amber-900 text-white gap-2">
            Review Queue <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}