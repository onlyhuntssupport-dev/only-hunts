"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { auth, db } from "@/lib/firebase/client";
import { collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; 
import { Send, ArrowLeft, Loader2, ShieldAlert, AlertCircle, Clock, ShieldCheck, CheckCircle2, Archive } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any; 
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
  unreadCount?: Record<string, number>;
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
    
    unsubChatRef.current = onSnapshot(chatRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ChatData;
          
          if (!data.participants.includes(currentUserId)) {
            router.push("/");
            return;
          }
          
          const unreadObj = data.unreadCount || {};
          if (unreadObj[currentUserId] > 0) {
            updateDoc(chatRef, {
              [`unreadCount.${currentUserId}`]: 0
            }).catch(err => console.error("Failed to mark as read:", err));
            
            data.unreadCount = { ...unreadObj, [currentUserId]: 0 };
          }

          setChatData(data);
        } else {
          router.push("/messages");
        }
      },
      (error: any) => {
        console.error("Chat room snapshot error:", error);
      }
    );

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    unsubMessagesRef.current = onSnapshot(q, 
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        setMessages(fetchedMessages);
        setLoading(false);
      },
      (error: any) => {
        console.error("Chat messages snapshot error:", error);
        setLoading(false);
      }
    );

    return () => {
      if (unsubChatRef.current) unsubChatRef.current();
      if (unsubMessagesRef.current) unsubMessagesRef.current();
    };
  }, [chatId, currentUserId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const containsRestrictedContent = (text: string) => {
    const phoneRegex = /(?:[-+() ]*\d){8,}/;
    const urlRegex = /([a-zA-Z0-9\-]+\.(com|co\.za|net|org|info|biz|me|za))|(https?:\/\/)|(www\.)/i;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
    return phoneRegex.test(text) || urlRegex.test(text) || emailRegex.test(text);
  };

  const handleArchiveChat = async () => {
    if (!window.confirm("Archive this conversation?")) return;
    try {
      await updateDoc(doc(db, "chats", chatId), {
        archivedBy: arrayUnion(currentUserId)
      });
      router.push("/messages");
    } catch (err) {
      console.error("Failed to archive chat:", err);
    }
  };

  const handleSendMessage = async () => {
    // 🛑 ATOMIC LOCK: Prevents double-firing if button or Enter key is double-tapped
    if (!newMessage.trim() || !currentUserId || !chatData || sending) return;
    
    setError("");

    if (containsRestrictedContent(newMessage) && chatData.type !== "ADMIN_SUPPORT") {
      setError("Message blocked: Contact info is not permitted before booking.");
      return;
    }

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(""); 

    try {
      const timestamp = new Date().toISOString();
      const otherUserId = chatData.participants.find(id => id !== currentUserId) || "";

      // 1. Save message to Firestore
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUserId,
        text: messageText,
        createdAt: timestamp
      });

      // 2. Update Chat document
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const currentUnread = chatSnap.data().unreadCount?.[otherUserId] || 0;
        await updateDoc(chatRef, {
          lastMessage: messageText,
          updatedAt: timestamp,
          [`unreadCount.${otherUserId}`]: currentUnread + 1,
          archivedBy: [] 
        });
      }

      // 3. Trigger Notification (Only one request)
      const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
      const fcmToken = otherUserDoc.data()?.fcmToken;

      if (fcmToken) {
        const isHunterSender = currentUserId === chatData.participants[0];
        const fallbackName = chatData.type === "ADMIN_SUPPORT" ? "Platform Admin" : "User";
        const senderName = userRole === "ADMIN" || userRole === "SUPER_ADMIN" 
          ? "Platform Support" 
          : (isHunterSender ? (chatData.hunterName || fallbackName) : (chatData.outfitterName || fallbackName));
        
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: fcmToken,
            title: `New Message from ${senderName}`,
            body: messageText
          })
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message.");
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

  const safeTimeString = (dateData: any) => {
    if (!dateData) return '';
    try {
      if (typeof dateData.toDate === 'function') {
        return dateData.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return new Date(dateData).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (loading || !chatData) return <KuduLoader />;

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";
  const isHunter = currentUserId === chatData.participants[0];
  const chatPartnerName = chatData.type === "ADMIN_SUPPORT" 
    ? (isAdmin ? (chatData.hunterName || "User") : "Platform Support")
    : (isHunter ? (chatData.outfitterName || "Outfitter") : (chatData.hunterName || "Hunter"));

  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <div className="fixed inset-0 z-0 h-screen w-full pointer-events-none">
        <Image src="/messages-bg.jpg" alt="Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/[0.45] backdrop-blur-[3px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 w-full md:max-w-4xl md:mx-auto md:py-6 h-full">
        <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md border-b-2 border-kalahari/20 p-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-lg font-black text-olive dark:text-off-white">{chatPartnerName}</h1>
                <p className="text-sm font-medium text-olive/80 dark:text-off-white/80">Regarding: {chatData.huntTitle || "General Inquiry"}</p>
              </div>
            </div>
            <Button onClick={handleArchiveChat} className="bg-kalahari text-white"><Archive className="h-4 w-4 mr-2" /> Archive</Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900 p-4 border-l-4 border-red-500 z-20">
            <p className="text-sm font-bold text-red-800 dark:text-red-100">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-black/20 z-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.senderId === "SYSTEM" ? "justify-center" : (msg.senderId === currentUserId ? "justify-end" : "justify-start")}`}>
              {msg.senderId === "SYSTEM" ? (
                <span className="bg-slate-900 text-kalahari text-[10px] px-4 py-1.5 rounded-full border border-kalahari/40 uppercase">{msg.text}</span>
              ) : (
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${msg.senderId === currentUserId ? "bg-kalahari text-white" : "bg-off-white dark:bg-slate-900 text-olive dark:text-off-white"}`}>
                  <p className="text-sm md:text-base font-bold whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[10px] font-black mt-2 block text-right opacity-60">{safeTimeString(msg.createdAt)}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white/90 dark:bg-black/60 p-4 sticky bottom-0 z-20 border-t-2 border-kalahari/20">
          <div className="flex items-end gap-3">
            <Textarea 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[48px] max-h-[120px] resize-none"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending} className="bg-kalahari text-white h-12 px-6">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}