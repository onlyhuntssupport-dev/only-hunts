"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "@/lib/firebase/client";
// FIX: Imported arrayUnion to handle the archive array safely
import { collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; 
import { Send, ArrowLeft, Loader2, ShieldAlert, AlertCircle, Clock, ShieldCheck, CheckCircle2, Archive, Trash2 } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ChatData {
  huntId?: string;
  huntTitle?: string;
  hunterName?: string;
  outfitterName?: string;
  type?: string;
  participants: string[];
  leadStatus?: "NEW" | "FOLLOW-UP" | "NEGOTIATING" | "BOOKED" | "ARCHIVED";
  archivedBy?: string[];
}

const LEAD_STATUSES = [
  { value: "NEW", label: "New Inquiry", icon: AlertCircle, color: "bg-kalahari text-white border-kalahari" },
  { value: "FOLLOW-UP", label: "Follow-Up", icon: Clock, color: "bg-blue-500 text-white border-blue-600" },
  { value: "NEGOTIATING", label: "Negotiating", icon: ShieldCheck, color: "bg-amber-500 text-white border-amber-600" },
  { value: "BOOKED", label: "Booked", icon: CheckCircle2, color: "bg-green-500 text-white border-green-600" },
  { value: "ARCHIVED", label: "Archived", icon: Archive, color: "bg-gray-500 text-white border-gray-600" }
];

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;

  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const unsubChatRef = useRef<(() => void) | null>(null);
  const unsubMessagesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role?.toUpperCase());
        }
      } else {
        if (unsubChatRef.current) {
          unsubChatRef.current();
          unsubChatRef.current = null;
        }
        if (unsubMessagesRef.current) {
          unsubMessagesRef.current();
          unsubMessagesRef.current = null;
        }
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUserId || !chatId) return;

    const chatRef = doc(db, "chats", chatId);
    
    unsubChatRef.current = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ChatData;
        
        if (!data.participants.includes(currentUserId)) {
          router.push("/");
          return;
        }
        
        setChatData(data);
        
        updateDoc(chatRef, {
          [`unreadCount.${currentUserId}`]: 0
        }).catch(err => console.error("Failed to mark as read:", err));
      } else {
        router.push("/messages");
      }
    });

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    unsubMessagesRef.current = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(fetchedMessages);
      setLoading(false);
    });

    return () => {
      if (unsubChatRef.current) unsubChatRef.current();
      if (unsubMessagesRef.current) unsubMessagesRef.current();
    };
  }, [chatId, currentUserId, router]);

  useEffect(() => {
    const healMissingName = async () => {
      if (chatData && chatData.type === "ADMIN_SUPPORT" && !chatData.hunterName && !chatData.outfitterName) {
        const otherUserId = chatData.participants.find(id => id !== currentUserId);
        
        if (otherUserId) {
          try {
            const userDoc = await getDoc(doc(db, "users", otherUserId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const realName = userData.companyName || userData.name || "Unknown User";

              await updateDoc(doc(db, "chats", chatId), {
                hunterName: realName
              });
            }
          } catch (err) {
            console.error("Failed to heal chat name:", err);
          }
        }
      }
    };

    healMissingName();
  }, [chatData, currentUserId, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const containsRestrictedContent = (text: string) => {
    const phoneRegex = /(?:[-+() ]*\d){8,}/;
    const urlRegex = /([a-zA-Z0-9\-]+\.(com|co\.za|net|org|info|biz|me|za))|(https?:\/\/)|(www\.)/i;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
    return phoneRegex.test(text) || urlRegex.test(text) || emailRegex.test(text);
  };

  // FIX: The Archive Function
  const handleArchiveChat = async () => {
    if (!window.confirm("Remove this conversation from your inbox? It will reappear if you receive a new message.")) return;
    
    try {
      await updateDoc(doc(db, "chats", chatId), {
        archivedBy: arrayUnion(currentUserId)
      });
      router.push("/messages");
    } catch (err) {
      console.error("Failed to archive chat:", err);
      alert("Failed to archive chat.");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !chatData) return;
    
    setError("");

    if (containsRestrictedContent(newMessage) && chatData.type !== "ADMIN_SUPPORT") {
      setError("Message blocked: Contact info (phones, emails, links) is not permitted before booking.");
      return;
    }

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(""); 

    try {
      const timestamp = new Date().toISOString();
      const otherUserId = chatData.participants.find(id => id !== currentUserId) || "";

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUserId,
        text: messageText,
        createdAt: timestamp
      });

      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const currentUnread = chatSnap.data().unreadCount?.[otherUserId] || 0;
        await updateDoc(chatRef, {
          lastMessage: messageText,
          updatedAt: timestamp,
          [`unreadCount.${otherUserId}`]: currentUnread + 1,
          archivedBy: [] // FIX: Sending a message instantly un-archives the chat for everyone
        });
      }

      try {
        const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
        const fcmToken = otherUserDoc.data()?.fcmToken;

        if (fcmToken) {
          const isHunterSender = currentUserId === chatData.participants[0];
          const fallbackName = chatData.type === "ADMIN_SUPPORT" ? "Platform Admin" : "Unknown User";
          const senderName = userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? "Platform Support" : (isHunterSender ? (chatData.hunterName || fallbackName) : (chatData.outfitterName || fallbackName));
          
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: fcmToken,
              title: `New Message from ${senderName}`,
              body: messageText
            })
          });
        }
      } catch (pushErr) {
        console.warn("Notification failed, but message was sent:", pushErr);
      }

    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      setNewMessage(messageText); 
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (userRole !== "OUTFITTER" || !chatData) return;
    try {
      const timestamp = new Date().toISOString();
      await updateDoc(doc(db, "chats", chatId), {
        leadStatus: newStatus,
        updatedAt: timestamp,
      });
      
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: "SYSTEM",
        text: `Pipeline status updated to: ${newStatus}`,
        createdAt: timestamp,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading || !chatData) return <KuduLoader />;

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";

  let chatPartnerName = "Unknown";
  if (chatData.type === "ADMIN_SUPPORT") {
    chatPartnerName = isAdmin ? (chatData.hunterName || chatData.outfitterName || "User") : "Platform Support";
  } else {
    const isHunter = currentUserId === chatData.participants[0];
    chatPartnerName = isHunter ? (chatData.outfitterName || "Outfitter") : (chatData.hunterName || "Hunter");
  }
  
  const displayTitle = chatData.huntTitle || "Platform Support";
  const isOutfitter = userRole === "OUTFITTER";
  const currentStatus = chatData.leadStatus || "NEW";

  return (
    <div className="relative min-h-[100dvh] flex flex-col transition-colors duration-300">
      
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

      <div className="relative z-10 flex flex-col flex-1 w-full md:max-w-4xl md:mx-auto md:py-6 h-full">
        <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md border-b-2 md:border-2 border-kalahari/20 dark:border-kalahari/40 md:rounded-t-2xl p-4 flex flex-col gap-4 shadow-md z-20 sticky top-0 transition-colors">
          
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => router.push('/messages')} className="text-olive dark:text-off-white hover:bg-kalahari/10 dark:hover:bg-kalahari/20 shrink-0">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-black font-headline text-olive dark:text-off-white truncate drop-shadow-sm transition-colors">
                    {chatPartnerName}
                  </h1>
                  {chatData.type === "ADMIN_SUPPORT" && (
                     <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border shrink-0 bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">
                       Admin
                     </span>
                  )}
                </div>
                <p className="text-sm font-medium text-olive/80 dark:text-off-white/80 truncate transition-colors">
                  Regarding: {displayTitle}
                </p>
              </div>
            </div>

            {/* FIX: Add the Archive/Trash Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleArchiveChat} 
              title="Archive Conversation"
              className="text-red-400 hover:bg-red-500/10 hover:text-red-500 shrink-0 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          {isOutfitter && chatData.type !== "ADMIN_SUPPORT" && (
            <div className="pt-3 border-t-2 border-dashed border-kalahari/20 overflow-x-auto pb-1 scrollbar-hide">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-xs font-bold text-olive/80 dark:text-off-white/80 uppercase tracking-widest mr-2">Pipeline:</span>
                {LEAD_STATUSES.map((status) => {
                  const Icon = status.icon;
                  const isActive = currentStatus === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => handleStatusUpdate(status.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border-2 transition-all ${
                        isActive 
                          ? status.color + " shadow-md scale-105" 
                          : "bg-white/50 dark:bg-black/40 text-olive/80 dark:text-off-white/70 border-kalahari/30 hover:border-kalahari/60"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {status.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/80 backdrop-blur-md border-l-4 border-red-500 p-4 flex items-center gap-3 animate-in slide-in-from-top-2 transition-colors z-20 shadow-md">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm font-bold text-red-800 dark:text-red-100 transition-colors">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] md:border-x-2 border-kalahari/20 dark:border-kalahari/40 flex flex-col transition-colors z-10">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-90 bg-black/50 backdrop-blur-md rounded-xl p-8 m-auto max-w-sm border border-kalahari/30">
              <p className="text-white font-black text-lg transition-colors drop-shadow-sm">No messages yet.</p>
              <p className="text-sm font-bold text-white/80 mt-1 transition-colors">Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              const isSystem = msg.senderId === "SYSTEM";

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-4">
                    <span className="bg-slate-900 text-kalahari text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-kalahari/40 text-center shadow-md">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 shadow-md flex flex-col transition-colors ${
                    isMine 
                      ? "bg-kalahari text-white rounded-br-sm" 
                      : "bg-off-white dark:bg-slate-900 text-olive dark:text-off-white rounded-bl-sm"
                  }`}>
                    <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-bold ${isMine ? 'text-white' : 'text-olive dark:text-off-white'}`}>
                      {msg.text}
                    </p>
                    <span className={`text-[10px] font-black mt-2 text-right transition-colors ${isMine ? "text-white/70" : "text-olive/50 dark:text-off-white/40"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md border-t-2 md:border-2 border-kalahari/20 dark:border-kalahari/40 md:rounded-b-2xl p-4 sticky bottom-0 shadow-[0_-8px_15px_rgba(0,0,0,0.15)] transition-colors z-20">
          <div className="flex items-end gap-3">
            <Textarea 
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (error) setError(""); 
              }}
              placeholder="Type your message..."
              className="flex-1 bg-white dark:bg-black/50 border-2 border-kalahari/30 dark:border-kalahari/50 focus-visible:ring-olive dark:focus-visible:ring-kalahari rounded-xl min-h-[48px] max-h-[120px] py-3 dark:text-off-white transition-colors resize-none overflow-y-auto font-medium shadow-inner"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sending}
              className="bg-kalahari hover:bg-kalahari/90 text-white rounded-xl h-12 px-6 shadow-md transition-all mb-0.5"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-center text-[10px] font-black text-olive/70 dark:text-off-white/50 mt-3 uppercase tracking-wider transition-colors drop-shadow-sm">
            For your safety, platform communication is monitored.
          </p>
        </div>
      </div>

    </div>
  );
}