"use client";

import Image from "next/image";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Cinematic Background Image & Overlay */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <Image
          src="/lodge-background.jpg"
          alt="South African Hunting Lodge"
          fill
          quality={100}
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        
        {/* Brand Logo Header */}
        <div className="flex justify-center mb-4">
          <Link href="/">
            <div className="h-20 w-20 bg-olive dark:bg-black/40 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-2 border-kalahari/20 transform rotate-3 hover:rotate-0 transition-all duration-300 cursor-pointer">
              <div className="-rotate-3 hover:rotate-0 transition-transform duration-300">
                <Image 
                  src="/logo-transparent.png" 
                  alt="Only-Hunts Logo" 
                  width={56} 
                  height={56} 
                  className="drop-shadow-md"
                  priority
                />
              </div>
            </div>
          </Link>
        </div>

        {/* We import the unified AuthForm here. */}
        <div className="bg-white dark:bg-black/30 shadow-xl border-2 border-kalahari/20 dark:border-kalahari/30 sm:rounded-2xl backdrop-blur-sm">
          <div className="[&>div]:mt-0 [&>div]:shadow-none [&>div]:border-none [&>div]:bg-transparent">
            <AuthForm />
          </div>
        </div>

      </div>
    </div>
  );
}