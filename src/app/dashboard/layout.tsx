"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Target, Settings, Home } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton"; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Outfitters", href: "/dashboard/outfitters", icon: Users },
    { name: "Marketplace", href: "/dashboard/hunts", icon: Target },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-off-white overflow-hidden font-body">
      {/* Sidebar */}
      <aside className="w-64 bg-off-white border-r-2 border-kalahari/30 flex flex-col shrink-0">
        
        {/* Logo Area */}
        <Link 
          href="/" 
          className="h-20 flex items-center px-6 border-b-2 border-kalahari/30 shrink-0 bg-olive group"
          title="Return to Main Site"
        >
          <div className="flex items-center gap-3">
            <div className="bg-kalahari text-olive dark:text-off-white font-bold font-headline h-8 w-8 flex items-center justify-center rounded shadow-sm text-lg">
              OH
            </div>
            <div className="flex flex-col">
              <span className="text-off-white font-headline font-bold text-lg tracking-wide leading-tight group-hover:text-kalahari transition-colors">
                Only-Hunts
              </span>
              <span className="text-kalahari text-[10px] font-bold uppercase tracking-widest leading-tight">Admin Portal</span>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname.startsWith(item.href);
              
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? "bg-kalahari/20 text-olive dark:text-off-white"
                    : "text-olive dark:text-off-white/70 hover:bg-kalahari/10 hover:text-olive dark:text-off-white"
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-olive dark:text-off-white" : "text-olive dark:text-off-white/70"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t-2 border-kalahari/30 shrink-0 space-y-2">
          <Link 
            href="/"
            className="flex items-center w-full px-3 py-2.5 text-sm font-bold text-olive dark:text-off-white/70 rounded-lg hover:bg-kalahari/10 hover:text-olive dark:text-off-white transition-colors"
          >
            <Home className="mr-3 h-5 w-5" />
            Back to Main Site
          </Link>
          
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}