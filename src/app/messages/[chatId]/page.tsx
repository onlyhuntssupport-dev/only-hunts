"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ChatData {
  huntId: string;
  huntTitle: string;
  hunterName: string;
  outfitterName: string;
  participants: string[];
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!currentUserId || !chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsubChat = onSnapshot(chatRef, (docSnap) => {
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
    
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(fetchedMessages);
      setLoading(false);
    });

    return () => {
      unsubChat();
      unsubMessages();
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !chatData) return;
    
    setError("");

    if (containsRestrictedContent(newMessage)) {
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
          [`unreadCount.${otherUserId}`]: currentUnread + 1
        });
      }

    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      setNewMessage(messageText); 
    } finally {
      setSending(false);
    }
  };

  if (loading || !chatData) return <KuduLoader />;

  const isHunter = currentUserId === chatData.participants[0];
  const chatPartnerName = isHunter ? chatData.outfitterName : chatData.hunterName;

  return (
    <div className="min-h-[100dvh] bg-off-white dark:bg-olive flex flex-col md:max-w-4xl md:mx-auto md:py-6 transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <div className="bg-white dark:bg-black/40 border-b-2 md:border-2 border-kalahari/20 dark:border-kalahari/30 md:rounded-t-2xl p-4 flex items-center gap-4 shadow-sm z-10 sticky top-0 transition-colors">
        <Button variant="ghost" size="icon" onClick={() => router.push('/messages')} className="text-olive dark:text-off-white hover:bg-kalahari/10 dark:hover:bg-kalahari/20">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black font-headline text-olive dark:text-off-white truncate transition-colors">
            {chatPartnerName}
          </h1>
          <p className="text-sm font-medium text-olive dark:text-off-white/60 truncate transition-colors">
            Regarding: {chatData.huntTitle}
          </p>
        </div>
      </div>

      {/* --- ERROR BANNER --- */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 flex items-center gap-3 animate-in slide-in-from-top-2 transition-colors">
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-800 dark:text-red-400 transition-colors">{error}</p>
        </div>
      )}

      {/* --- MESSAGE FEED --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-black/10 md:border-x-2 border-kalahari/20 dark:border-kalahari/30 flex flex-col transition-colors">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
            <p className="text-olive dark:text-off-white font-bold transition-colors">No messages yet.</p>
            <p className="text-sm font-medium text-olive dark:text-off-white/70 transition-colors">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm flex flex-col transition-colors ${
                  isMine 
                    ? "bg-olive dark:bg-kalahari text-white dark:text-olive rounded-br-sm" 
                    : "bg-white dark:bg-black/40 border-2 border-kalahari/10 dark:border-kalahari/20 text-olive dark:text-off-white rounded-bl-sm"
                }`}>
                  <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium ${isMine ? 'text-white dark:text-olive' : 'text-olive dark:text-off-white'}`}>
                    {msg.text}
                  </p>
                  <span className={`text-[10px] font-bold mt-2 text-right transition-colors ${isMine ? "text-white/60 dark:text-olive/70" : "text-olive/60 dark:text-off-white/40"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* --- INPUT AREA --- */}
      <div className="bg-white dark:bg-black/40 border-t-2 md:border-2 border-kalahari/20 dark:border-kalahari/30 md:rounded-b-2xl p-4 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <Input 
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (error) setError(""); 
            }}
            placeholder="Type your message here..."
            className="flex-1 bg-off-white dark:bg-black/50 border-kalahari/30 dark:border-kalahari/40 focus-visible:ring-olive dark:focus-visible:ring-kalahari rounded-xl h-12 dark:text-off-white transition-colors"
            autoComplete="off"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="bg-kalahari hover:bg-kalahari/90 text-white rounded-xl h-12 px-6 shadow-sm transition-colors"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
        <p className="text-center text-[10px] font-bold text-olive dark:text-off-white/40 mt-3 uppercase tracking-wider transition-colors">
          For your safety, platform communication is monitored.
        </p>
      </div>

    </div>
  );
}