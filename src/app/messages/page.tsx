"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Search, Clock } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface ChatPreview {
  id: string;
  huntId: string;
  huntTitle: string;
  hunterName: string;
  outfitterName: string;
  participants: string[];
  lastMessage: string;
  updatedAt: string;
  unreadCount: Record<string, number>;
}

export default function InboxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<"HUNTER" | "OUTFITTER" | null>(null);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
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
          setUserRole(userDoc.data().role as "HUNTER" | "OUTFITTER");
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe();
  }, [currentUserId]);

  if (loading) return <KuduLoader />;

  const filteredChats = chats.filter(chat => {
    const partnerName = currentUserId === chat.participants[0] ? chat.outfitterName : chat.hunterName;
    const searchLower = searchQuery.toLowerCase();
    return partnerName.toLowerCase().includes(searchLower) || chat.huntTitle.toLowerCase().includes(searchLower);
  });

  const dashboardRoute = userRole === "OUTFITTER" ? "/outfitter/dashboard" : "/hunter/dashboard";

  return (
    <div className="min-h-screen bg-off-white dark:bg-olive pb-20 transition-colors duration-300">
      
      {/* Header */}
      <div className="bg-olive dark:bg-black/20 py-10 border-b-4 border-kalahari transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(dashboardRoute)}
            className="text-off-white hover:text-kalahari hover:bg-white/10 dark:hover:bg-white/5 -ml-4 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Basecamp
          </Button>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-off-white tracking-tight flex items-center gap-3 transition-colors">
            <MessageSquare className="h-10 w-10 text-kalahari" /> Your Inbox
          </h1>
          <p className="text-off-white/70 dark:text-off-white/50 mt-2 text-lg font-medium transition-colors">
            Manage your conversations and secure your safaris.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Search Bar */}
        {chats.length > 0 && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-olive dark:text-kalahari/70" />
            <input 
              type="text" 
              placeholder="Search by name or package title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-kalahari/20 dark:border-kalahari/40 focus:border-olive dark:focus:border-kalahari focus:ring-0 outline-none transition-colors font-medium bg-white dark:bg-black/30 dark:text-off-white shadow-sm"
            />
          </div>
        )}

        {/* Inbox Feed */}
        {chats.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-black/20 border-2 border-dashed border-kalahari/30 dark:border-kalahari/40 rounded-2xl shadow-sm transition-colors">
            <MessageSquare className="mx-auto h-16 w-16 text-kalahari/40 mb-4" />
            <h3 className="text-2xl font-black font-headline text-olive dark:text-off-white transition-colors">Your inbox is empty</h3>
            <p className="text-olive dark:text-off-white/70 mt-2 max-w-md mx-auto font-medium transition-colors">
              You don't have any active conversations yet.
            </p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12 text-olive dark:text-off-white/60 font-bold transition-colors">
            No conversations match your search.
          </div>
        ) : (
          <div className="bg-white dark:bg-black/20 rounded-2xl border-2 border-kalahari/20 dark:border-kalahari/30 shadow-sm overflow-hidden divide-y-2 divide-kalahari/10 dark:divide-kalahari/20 transition-colors duration-300">
            {filteredChats.map((chat) => {
              const isHunter = currentUserId === chat.participants[0];
              const partnerName = isHunter ? chat.outfitterName : chat.hunterName;
              const unreadCount = chat.unreadCount?.[currentUserId || ""] || 0;
              const hasUnread = unreadCount > 0;

              return (
                <Link 
                  key={chat.id} 
                  href={`/messages/${chat.id}`}
                  className={`block p-4 sm:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${hasUnread ? 'bg-orange-50/30 dark:bg-kalahari/10' : ''}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-lg font-headline truncate transition-colors ${hasUnread ? 'font-black text-olive dark:text-off-white' : 'font-bold text-olive dark:text-off-white/80'}`}>
                          {partnerName}
                        </h3>
                        {hasUnread && (
                          <span className="bg-kalahari text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs font-bold text-kalahari uppercase tracking-widest mb-2 truncate transition-colors">
                        {chat.huntTitle}
                      </p>
                      
                      <p className={`text-sm truncate transition-colors ${hasUnread ? 'font-bold text-olive dark:text-off-white' : 'font-medium text-olive dark:text-off-white/60'}`}>
                        {chat.lastMessage || "Conversation started..."}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-olive/60 dark:text-off-white/40 flex items-center gap-1 transition-colors">
                        <Clock className="h-3 w-3" />
                        {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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