"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
// FIX: Imported Inbox and Archive icons for the tabs
import { MessageSquare, ArrowLeft, Search, Clock, Inbox, Archive } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface ChatPreview {
  id: string;
  huntId?: string;
  huntTitle?: string;
  hunterName?: string;
  outfitterName?: string;
  type?: string;
  participants: string[];
  lastMessage: string;
  updatedAt: string;
  unreadCount: Record<string, number>;
  leadStatus?: "NEW" | "FOLLOW-UP" | "NEGOTIATING" | "BOOKED" | "ARCHIVED";
  archivedBy?: string[];
}

export default function InboxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // FIX: Added state for the tab switcher
  const [viewMode, setViewMode] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const unsubChatsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        if (unsubChatsRef.current) {
          unsubChatsRef.current();
          unsubChatsRef.current = null;
        }
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUserRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUserId));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role?.toUpperCase());
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    fetchUserRole();

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUserId),
      orderBy("updatedAt", "desc")
    );

    unsubChatsRef.current = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatPreview[];
      
      setChats(fetchedChats);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setLoading(false);
    });

    return () => {
      if (unsubChatsRef.current) {
        unsubChatsRef.current();
        unsubChatsRef.current = null;
      }
    };
  }, [currentUserId]);

  if (loading) return <KuduLoader />;

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";

  const filteredChats = chats.filter(chat => {
    const isArchived = chat.archivedBy && chat.archivedBy.includes(currentUserId || "");

    // FIX: Apply the Active/Archived filter before checking the search query
    if (viewMode === "ACTIVE" && isArchived) return false;
    if (viewMode === "ARCHIVED" && !isArchived) return false;

    let partnerName = "Unknown";
    
    if (chat.type === "ADMIN_SUPPORT") {
      partnerName = isAdmin ? (chat.hunterName || chat.outfitterName || "User") : "Platform Support";
    } else {
      const isHunter = currentUserId === chat.participants[0];
      partnerName = isHunter ? (chat.outfitterName || "Outfitter") : (chat.hunterName || "Hunter");
    }

    const huntTitle = chat.huntTitle || "Platform Support";
    const searchLower = searchQuery.toLowerCase();
    
    return partnerName.toLowerCase().includes(searchLower) || huntTitle.toLowerCase().includes(searchLower);
  });

  let dashboardRoute = "/hunter/dashboard";
  if (userRole === "OUTFITTER") {
    dashboardRoute = "/outfitter/dashboard";
  } else if (isAdmin) {
    dashboardRoute = "/admin";
  }

  // FIX: Calculate counts for the tabs
  const activeCount = chats.filter(c => !(c.archivedBy && c.archivedBy.includes(currentUserId || ""))).length;
  const archivedCount = chats.filter(c => c.archivedBy && c.archivedBy.includes(currentUserId || "")).length;

  return (
    <div className="relative min-h-screen pb-20 transition-colors duration-300">
      
      <div className="fixed inset-0 z-0 h-screen w-full pointer-events-none">
        <Image
          src="/messages-bg.jpg" 
          alt="African Safari Tent Desk"
          fill
          quality={100}
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/[0.45] backdrop-blur-[3px]" />
      </div>

      <div className="relative z-10 bg-olive/90 dark:bg-black/60 backdrop-blur-md py-10 border-b-4 border-kalahari transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(dashboardRoute)}
            className="text-off-white hover:text-kalahari hover:bg-white/10 dark:hover:bg-white/5 -ml-4 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Basecamp
          </Button>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-off-white tracking-tight flex items-center gap-3 transition-colors drop-shadow-md">
            <MessageSquare className="h-10 w-10 text-kalahari" /> Your Inbox
          </h1>
          <p className="text-off-white/80 mt-2 text-lg font-medium transition-colors drop-shadow-sm">
            Manage your conversations and secure your safaris.
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 mt-8 space-y-6">
        
        {/* FIX: The Tab Switcher */}
        <div className="flex items-center gap-2 bg-white/80 dark:bg-black/50 p-1.5 rounded-2xl backdrop-blur-sm w-fit border-2 border-kalahari/20 dark:border-kalahari/40 shadow-sm transition-colors">
          <button 
            onClick={() => setViewMode("ACTIVE")} 
            className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${viewMode === "ACTIVE" ? "bg-kalahari text-white shadow-md scale-[1.02]" : "text-olive/70 dark:text-off-white/60 hover:text-kalahari"}`}
          >
            <Inbox className="h-4 w-4" /> Active ({activeCount})
          </button>
          <button 
            onClick={() => setViewMode("ARCHIVED")} 
            className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${viewMode === "ARCHIVED" ? "bg-kalahari text-white shadow-md scale-[1.02]" : "text-olive/70 dark:text-off-white/60 hover:text-kalahari"}`}
          >
            <Archive className="h-4 w-4" /> Archived ({archivedCount})
          </button>
        </div>

        {/* Search Bar */}
        {(activeCount > 0 || archivedCount > 0) && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-olive dark:text-kalahari/70" />
            <input 
              type="text" 
              placeholder={`Search ${viewMode === "ACTIVE" ? "active" : "archived"} conversations...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-kalahari/20 dark:border-kalahari/40 focus:border-olive dark:focus:border-kalahari focus:ring-0 outline-none transition-colors font-medium bg-white/95 dark:bg-black/50 backdrop-blur-sm dark:text-off-white shadow-xl"
            />
          </div>
        )}

        {/* Inbox Feed */}
        {chats.length === 0 ? (
          <div className="text-center py-20 bg-white/95 dark:bg-black/50 backdrop-blur-sm border-2 border-dashed border-kalahari/30 dark:border-kalahari/40 rounded-2xl shadow-xl transition-colors">
            <MessageSquare className="mx-auto h-16 w-16 text-kalahari/40 mb-4" />
            <h3 className="text-2xl font-black font-headline text-olive dark:text-off-white transition-colors">Your inbox is empty</h3>
            <p className="text-olive dark:text-off-white/70 mt-2 max-w-md mx-auto font-medium transition-colors">
              You don't have any active conversations yet.
            </p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-20 bg-white/95 dark:bg-black/50 backdrop-blur-sm border-2 border-dashed border-kalahari/30 dark:border-kalahari/40 rounded-2xl shadow-xl transition-colors">
            {viewMode === "ARCHIVED" ? (
              <>
                <Archive className="mx-auto h-16 w-16 text-kalahari/40 mb-4" />
                <h3 className="text-2xl font-black font-headline text-olive dark:text-off-white transition-colors">No Archived Chats</h3>
                <p className="text-olive dark:text-off-white/70 mt-2 max-w-md mx-auto font-medium transition-colors">
                  Conversations you archive will appear here.
                </p>
              </>
            ) : (
              <>
                <Inbox className="mx-auto h-16 w-16 text-kalahari/40 mb-4" />
                <h3 className="text-2xl font-black font-headline text-olive dark:text-off-white transition-colors">No Active Chats</h3>
                <p className="text-olive dark:text-off-white/70 mt-2 max-w-md mx-auto font-medium transition-colors">
                  {searchQuery ? "No conversations match your search." : "All caught up! Your active inbox is clear."}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white/95 dark:bg-black/50 backdrop-blur-sm rounded-2xl border-2 border-kalahari/20 dark:border-kalahari/30 shadow-xl overflow-hidden divide-y-2 divide-kalahari/10 dark:divide-kalahari/20 transition-colors duration-300">
            {filteredChats.map((chat) => {
              
              let partnerName = "Unknown";
              if (chat.type === "ADMIN_SUPPORT") {
                partnerName = isAdmin ? (chat.hunterName || chat.outfitterName || "User") : "Platform Support";
              } else {
                const isHunter = currentUserId === chat.participants[0];
                partnerName = isHunter ? (chat.outfitterName || "Outfitter") : (chat.hunterName || "Hunter");
              }

              const huntTitle = chat.huntTitle || "Platform Support";
              const unreadCount = chat.unreadCount?.[currentUserId || ""] || 0;
              const hasUnread = unreadCount > 0 && viewMode === "ACTIVE"; // Archived chats shouldn't ping as unread

              return (
                <Link 
                  key={chat.id} 
                  href={`/messages/${chat.id}`}
                  className={`block p-4 sm:p-6 transition-colors hover:bg-white dark:hover:bg-black/60 ${hasUnread ? 'bg-orange-50/50 dark:bg-kalahari/20' : ''}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-lg font-headline truncate transition-colors ${hasUnread ? 'font-black text-olive dark:text-off-white' : 'font-bold text-olive dark:text-off-white/90'}`}>
                          {partnerName}
                        </h3>

                        {userRole === "OUTFITTER" && chat.type !== "ADMIN_SUPPORT" && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border shrink-0 ${
                            chat.leadStatus === 'BOOKED' ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' :
                            chat.leadStatus === 'NEGOTIATING' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30' :
                            chat.leadStatus === 'FOLLOW-UP' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30' :
                            chat.leadStatus === 'ARCHIVED' ? 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30' :
                            'bg-kalahari/20 text-kalahari dark:text-kalahari border-kalahari/30'
                          }`}>
                            {chat.leadStatus || 'NEW'}
                          </span>
                        )}

                        {chat.type === "ADMIN_SUPPORT" && (
                           <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border shrink-0 bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">
                             Official Support
                           </span>
                        )}

                        {hasUnread && (
                          <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs font-bold text-kalahari uppercase tracking-widest mb-2 truncate transition-colors">
                        {huntTitle}
                      </p>
                      
                      <p className={`text-sm truncate transition-colors ${hasUnread ? 'font-bold text-olive dark:text-off-white' : 'font-medium text-olive dark:text-off-white/70'}`}>
                        {chat.lastMessage || "Conversation started..."}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-olive/80 dark:text-off-white/50 flex items-center gap-1 transition-colors">
                        <Clock className="h-3 w-3" />
                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}