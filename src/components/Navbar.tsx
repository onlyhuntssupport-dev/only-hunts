"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Loader2, Compass, User, MessageSquare, Heart, Settings, ChevronDown, Briefcase } from "lucide-react";
import SupportModal from "@/components/support/SupportModal";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDashboard = pathname?.includes('/dashboard') || pathname === '/admin';
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup') || pathname?.includes('/register');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role?.toUpperCase());
            setProfilePic(userData.profileImageUrl || currentUser.photoURL || null);
          }

          if (unsubscribeMessagesRef.current) {
            unsubscribeMessagesRef.current();
          }

          const chatsRef = collection(db, "chats");
          const q = query(chatsRef, where("participants", "array-contains", currentUser.uid));
          
          unsubscribeMessagesRef.current = onSnapshot(q, 
            (snapshot) => {
              let hasUnread = false;
              snapshot.docs.forEach((doc) => {
                const data = doc.data();
                if (data.unreadCount && data.unreadCount[currentUser.uid] > 0) {
                  hasUnread = true;
                }
              });
              setHasUnreadMessages(hasUnread);
            }, 
            (error: any) => {
              if (error.code === 'permission-denied') {
                console.log("Waiting for database security rules to sync...");
              } else {
                console.error("Messages snapshot error:", error);
              }
            }
          );

        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setUser(null);
        setRole(null);
        setProfilePic(null);
        setHasUnreadMessages(false);
        
        if (unsubscribeMessagesRef.current) {
          unsubscribeMessagesRef.current();
          unsubscribeMessagesRef.current = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }
    
    try {
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handleDashboardClick = () => {
    if (role === "OUTFITTER") {
      router.push("/outfitter/dashboard");
    } else if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERADMIN") {
      router.push("/admin");
    } else {
      router.push("/hunter/dashboard");
    }
  };

  return (
    <nav className="bg-white dark:bg-olive/95 dark:backdrop-blur-md border-b-2 border-kalahari/20 dark:border-kalahari/30 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      
      <style>{`
        @keyframes rifle-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .animate-rifle-shake {
          animation: rifle-shake 0.5s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <Link href="/" className="flex items-center gap-3 group">
            <Image 
              src="/logo-transparent.png" 
              alt="Only-Hunts Logo" 
              width={48} 
              height={48} 
              className="group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              priority
            />
            <span className="font-black font-headline text-2xl text-olive dark:text-off-white tracking-tight transition-colors">
              Only-Hunts
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            
            {!isDashboard && (
              <>
                <Button asChild variant="ghost" className="text-olive dark:text-off-white dark:text-kalahari font-bold hover:bg-kalahari/10 hover:text-olive dark:text-off-white dark:hover:text-off-white text-sm sm:text-base flex px-2 sm:px-4 transition-colors">
                  <Link href="/marketplace">
                    <Compass className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Marketplace</span>
                  </Link>
                </Button>
                {!isAuthPage && <div className="h-6 w-px bg-kalahari/30 mx-1 sm:mx-2 hidden sm:block"></div>}
              </>
            )}

            {!isAuthPage && (
              <>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-kalahari" />
                ) : user ? (
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    
                    <SupportModal variant="header" />

                    {hasUnreadMessages && (
                      <Link href="/messages" className="relative p-2 rounded-full hover:bg-kalahari/10 transition-colors group flex items-center justify-center mr-1">
                        <svg 
                          viewBox="0 0 120 40" 
                          fill="currentColor" 
                          className="h-7 w-auto transition-colors animate-rifle-shake text-amber-600 dark:text-amber-500"
                        >
                          <path d="M5,16 C10,15 15,15 20,16 C25,17 28,18 32,18 L45,18 L115,19 L115,20.5 L60,20.5 C55,22 50,23 45,23 L35,23 C33,23 30,27 28,30 C25,32 20,32 18,30 C15,28 10,27 5,28 Z" />
                          <path d="M33,23 C33,28 40,28 41,23 L39,23 C38,26 35,26 34,23 Z" />
                          <rect x="36" y="22" width="1.5" height="4" />
                          <path d="M30,14 L28,10 L48,10 L46,14 Z" />
                          <rect x="33" y="14" width="2" height="4" />
                          <rect x="41" y="14" width="2" height="4" />
                          <circle cx="32" cy="20" r="1.5" />
                          <rect x="115" y="18.5" width="3" height="2.5" />
                        </svg>

                        <span className="absolute top-0 right-0 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-white dark:border-olive"></span>
                        </span>
                      </Link>
                    )}

                    <Button onClick={handleDashboardClick} className="bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive dark:text-off-white font-black shadow-md hidden sm:flex transition-colors">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                    
                    <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 p-1 pr-2 rounded-full border-2 border-kalahari/20 dark:border-kalahari/40 hover:border-kalahari transition-colors bg-off-white dark:bg-olive/50 focus:outline-none"
                      >
                        <div className="h-8 w-8 bg-kalahari/20 rounded-full flex items-center justify-center text-olive dark:text-off-white dark:text-kalahari overflow-hidden">
                          {profilePic ? (
                            <img src={profilePic} alt="User" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-olive dark:text-off-white/60 dark:text-kalahari/60" />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-olive rounded-xl shadow-xl border-2 border-kalahari/20 dark:border-kalahari/40 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          
                          <div className="px-4 py-3 border-b-2 border-kalahari/10 dark:border-kalahari/20 bg-off-white dark:bg-black/20">
                            <p className="text-sm font-black text-olive dark:text-off-white truncate transition-colors">
                              {user.displayName || (role === "OUTFITTER" ? "Outfitter Account" : role === "ADMIN" ? "Admin" : "Hunter Account")}
                            </p>
                            <p className="text-xs font-medium text-olive dark:text-off-white/60 dark:text-kalahari/80 truncate transition-colors">{user.email}</p>
                          </div>

                          <div className="p-2 flex flex-col gap-1">
                            <button 
                              onClick={() => { setDropdownOpen(false); handleDashboardClick(); }}
                              className="sm:hidden flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors w-full text-left"
                            >
                              <LayoutDashboard className="h-4 w-4 mr-3 text-kalahari" /> Dashboard
                            </button>

                            <Link 
                              href="/messages" 
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                            >
                              <MessageSquare className="h-4 w-4 mr-3 text-kalahari" /> Messages
                            </Link>

                            {role === "OUTFITTER" ? (
                              <Link 
                                href="/outfitter/billing" 
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                              >
                                <Briefcase className="h-4 w-4 mr-3 text-kalahari" /> Billing & Plans
                              </Link>
                            ) : role === "ADMIN" || role === "SUPER_ADMIN" ? (
                              <Link 
                                href="/admin" 
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                              >
                                <LayoutDashboard className="h-4 w-4 mr-3 text-kalahari" /> Admin Panel
                              </Link>
                            ) : (
                              <Link 
                                href="/hunter/dashboard" 
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                              >
                                <Heart className="h-4 w-4 mr-3 text-kalahari" /> Saved Wishlist
                              </Link>
                            )}

                            <Link 
                              href="/profile/edit" 
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center px-3 py-2 text-sm font-bold text-olive dark:text-off-white/80 hover:text-olive dark:hover:text-kalahari hover:bg-kalahari/10 rounded-lg transition-colors"
                            >
                              <Settings className="h-4 w-4 mr-3 text-kalahari" /> Account Settings
                            </Link>
                          </div>

                          <div className="p-2 border-t-2 border-kalahari/10 dark:border-kalahari/20">
                            <button 
                              onClick={handleLogout} 
                              className="w-full flex items-center px-3 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-left"
                            >
                              <LogOut className="h-4 w-4 mr-3" /> Sign Out
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>

                ) : (
                  <>
                    <Button asChild variant="ghost" className="text-olive dark:text-off-white dark:text-kalahari font-bold hover:bg-kalahari/10 transition-colors">
                      <Link href="/login">
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild className="bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive dark:text-off-white font-black shadow-md transition-colors">
                      <Link href="/signup">
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}