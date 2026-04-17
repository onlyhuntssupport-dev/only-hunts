"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, ShieldAlert, Wrench, CheckCircle, 
  Clock, ChevronDown, ChevronUp, Mail, User, Shield, Archive, Trash2, MessageSquare, Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  category: "BOOKING_ISSUE" | "SAFETY_CONCERN" | "TECH_ISSUE" | string;
  message: string;
  status: "OPEN" | "RESOLVED" | "ARCHIVED";
  createdAt: any; 
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "supportTickets"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      
      setTickets(fetchedTickets);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tickets:", error);
      toast({ title: "Error", description: "Failed to load support tickets.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const toggleStatus = async (ticketId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "OPEN" ? "RESOLVED" : "OPEN";
      await updateDoc(doc(db, "supportTickets", ticketId), { status: newStatus });
      toast({ title: "Ticket Updated", description: `Ticket marked as ${newStatus}.` });
    } catch (error) {
      toast({ title: "Error", description: "Could not update ticket status.", variant: "destructive" });
    }
  };

  const archiveTicket = async (ticketId: string) => {
    if (!window.confirm("Are you sure you want to archive this ticket? It will be removed from this view.")) return;
    
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), { status: "ARCHIVED" });
      toast({ title: "Ticket Archived", description: "Ticket has been removed from the inbox." });
      setExpandedId(null);
    } catch (error) {
      toast({ title: "Error", description: "Could not archive ticket.", variant: "destructive" });
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this ticket? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, "supportTickets", ticketId));
      toast({ title: "Ticket Deleted", description: "Ticket permanently removed from database." });
      setExpandedId(null);
    } catch (error) {
      toast({ title: "Error", description: "Could not delete ticket.", variant: "destructive" });
    }
  };

  // NEW: Advanced routing function to bridge Support Tickets and the Messaging App
  const handleStartChat = async (ticket: SupportTicket) => {
    try {
      setStartingChatId(ticket.id);
      const adminId = auth.currentUser?.uid;
      
      if (!adminId) {
        toast({ title: "Error", description: "You must be authenticated.", variant: "destructive" });
        setStartingChatId(null);
        return;
      }

      // 1. AUTO-RESOLVE TICKET TO CLEAR NOTIFICATION BADGE
      await updateDoc(doc(db, "supportTickets", ticket.id), { status: "RESOLVED" }).catch((err) => {
          console.error("Could not auto-resolve ticket:", err);
      });

      // 2. Check if an admin chat already exists for this specific user to prevent duplicates
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("type", "==", "ADMIN_SUPPORT"),
        where("participants", "array-contains", ticket.userId)
      );
      
      const querySnapshot = await getDocs(q);
      let targetChatId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(adminId)) {
          targetChatId = doc.id;
        }
      });

      // 3. If no active chat exists, generate a new one
      if (!targetChatId) {
        const newChat = await addDoc(collection(db, "chats"), {
          type: "ADMIN_SUPPORT",
          participants: [ticket.userId, adminId],
          hunterName: ticket.userName || "User", 
          huntTitle: `Platform Support`,
          lastMessage: "Admin joined the chat",
          updatedAt: new Date().toISOString(),
          unreadCount: {
            [ticket.userId]: 1,
            [adminId]: 0
          }
        });
        targetChatId = newChat.id;

        // Inject an automated system message for context
        await addDoc(collection(db, "chats", targetChatId, "messages"), {
          senderId: "SYSTEM",
          text: `Admin initiated support chat regarding: ${ticket.category ? ticket.category.replace('_', ' ') : 'General Inquiry'}`,
          createdAt: new Date().toISOString()
        });
      }

      // 4. Navigate the admin directly into the chat room
      toast({ title: "Chat Started", description: "Redirecting to secure messaging..." });
      router.push(`/messages/${targetChatId}`);
      
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({ title: "Error", description: "Could not start message thread.", variant: "destructive" });
      setStartingChatId(null);
    }
  };

  const getCategoryDetails = (category: string | undefined) => {
    switch (category) {
      case "BOOKING_ISSUE": return { icon: AlertTriangle, label: "Booking/Quote", color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 border-orange-200 dark:border-orange-900/50" };
      case "SAFETY_CONCERN": return { icon: ShieldAlert, label: "Safety/Report", color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30 border-red-200 dark:border-red-900/50" };
      case "TECH_ISSUE": return { icon: Wrench, label: "Technical", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border-blue-200 dark:border-blue-900/50" };
      default: return { icon: AlertTriangle, label: "Other", color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800" };
    }
  };

  const formatTicketDate = (dateData: any) => {
    if (!dateData) return "Unknown time";
    try {
      if (typeof dateData.toDate === 'function') {
        return formatDistanceToNow(dateData.toDate(), { addSuffix: true });
      }
      return formatDistanceToNow(new Date(dateData), { addSuffix: true });
    } catch (e) {
      return "Invalid date";
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading secure inbox...</div>;

  const visibleTickets = tickets.filter(t => t.status !== "ARCHIVED");
  const openTickets = visibleTickets.filter(t => t.status === "OPEN");
  const resolvedTickets = visibleTickets.filter(t => t.status === "RESOLVED");
  const sortedTickets = [...openTickets, ...resolvedTickets];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-kalahari/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-olive dark:text-off-white tracking-tight">Support Triage</h1>
          <p className="text-olive/60 dark:text-off-white/60 font-medium mt-1">Real-time inbox for user reports and issues.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 font-bold text-sm flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            {openTickets.length} Action Required
          </div>
        </div>
      </div>

      {sortedTickets.length === 0 ? (
        <div className="text-center py-20 bg-off-white dark:bg-stone-950 rounded-2xl border border-dashed border-kalahari/20">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-black text-olive dark:text-off-white">Inbox Zero</h3>
          <p className="text-olive/60 dark:text-off-white/60 font-medium">No active support tickets.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            const cat = getCategoryDetails(ticket.category);
            const Icon = cat.icon;
            
            return (
              <div key={ticket.id} className={`bg-white dark:bg-stone-900 border rounded-xl overflow-hidden transition-all ${ticket.status === "RESOLVED" ? "opacity-60 border-kalahari/10" : "border-kalahari/30 shadow-sm"}`}>
                <div onClick={() => setExpandedId(isExpanded ? null : ticket.id)} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer">
                  <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                    <div className={`p-3 rounded-lg border shrink-0 ${cat.color}`}><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-black truncate ${ticket.status === "RESOLVED" ? "line-through text-olive/50" : "text-olive dark:text-off-white"}`}>{ticket.userName || 'Unknown User'}</h3>
                        <span className="text-xs font-bold px-2 py-0.5 bg-kalahari/10 text-olive/70 rounded-md">{ticket.userRole || 'UNKNOWN'}</span>
                      </div>
                      <p className="text-sm text-olive/60 font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTicketDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 shrink-0">
                    <div className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${cat.color}`}>{cat.label}</div>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-kalahari/10 bg-off-white dark:bg-stone-950/50 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="text-xs font-black text-olive/50 uppercase tracking-widest">Message Payload</h4>
                        <div className="p-4 bg-white dark:bg-stone-900 border border-kalahari/10 rounded-xl">
                          <p className="text-sm font-medium text-olive dark:text-off-white whitespace-pre-wrap leading-relaxed">{ticket.message || 'No message provided.'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-olive/50 uppercase tracking-widest">Actions & Info</h4>
                          <div className="p-4 bg-white dark:bg-stone-900 border border-kalahari/10 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-sm text-olive/80 font-medium overflow-hidden">
                              <User className="h-4 w-4 shrink-0 text-kalahari" />
                              <span className="truncate">{ticket.userName || 'Unknown User'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-olive/80 font-medium overflow-hidden">
                              <Mail className="h-4 w-4 shrink-0 text-kalahari" />
                              <span className="truncate">{ticket.userEmail || 'No email provided'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-olive/80 font-medium overflow-hidden">
                              <Shield className="h-4 w-4 shrink-0 text-kalahari" />
                              <span className="truncate font-mono text-xs">{ticket.userId || 'Unknown ID'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartChat(ticket); }}
                            disabled={startingChatId === ticket.id}
                            className="w-full py-3 px-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all shadow-sm bg-kalahari text-white hover:bg-kalahari/90 disabled:opacity-70"
                          >
                            {startingChatId === ticket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                            Reply via Message
                          </button>

                          <a 
                            href={`mailto:${ticket.userEmail || ''}?subject=Only-Hunts Support: ${ticket.category ? ticket.category.replace('_', ' ') : 'General Inquiry'}`}
                            className="w-full py-3 px-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all shadow-sm bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                          >
                            <Mail className="h-4 w-4" /> Reply via Email
                          </a>

                          <button
                            onClick={(e) => { e.stopPropagation(); toggleStatus(ticket.id, ticket.status); }}
                            className={`w-full py-3 px-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all shadow-sm hover:shadow-md ${
                              ticket.status === "OPEN" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-kalahari/20 hover:bg-kalahari/30 text-olive dark:text-white"
                            }`}
                          >
                            {ticket.status === "OPEN" ? <><CheckCircle className="h-5 w-5" /> Mark as Resolved</> : "Reopen Ticket"}
                          </button>

                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); archiveTicket(ticket.id); }}
                              className="w-full py-3 px-2 rounded-xl font-black text-sm flex justify-center items-center gap-1.5 transition-all shadow-sm bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700"
                            >
                              <Archive className="h-4 w-4" /> Archive
                            </button>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteTicket(ticket.id); }}
                              className="w-full py-3 px-2 rounded-xl font-black text-sm flex justify-center items-center gap-1.5 transition-all shadow-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/40"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}