"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { Bell, CheckCircle, Info, AlertCircle, X } from "lucide-react";

interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "SUCCESS" | "ALERT" | "INFO";
  link?: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to Firestore in Real-Time
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setNotifications([]);
        return;
      }

      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnap = onSnapshot(q, (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((doc) => {
          notifs.push({ id: doc.id, ...doc.data() } as AppNotification);
        });
        setNotifications(notifs);
      });

      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const notifRef = doc(db, "notifications", id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-olive hover:text-kalahari dark:text-off-white dark:hover:text-kalahari transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-stone-800"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-stone-950"></span>
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-kalahari/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="bg-gray-50 dark:bg-stone-950 px-4 py-3 border-b border-kalahari/10 flex justify-between items-center">
            <h3 className="font-black text-olive dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-bold text-kalahari hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-olive/50 dark:text-off-white/40 font-bold text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-gray-100 dark:border-stone-800 transition-colors ${notif.read ? 'bg-white dark:bg-stone-900' : 'bg-orange-50/50 dark:bg-orange-950/10'}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 shrink-0">
                      {notif.type === 'SUCCESS' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {notif.type === 'ALERT' && <AlertCircle className="h-5 w-5 text-orange-500" />}
                      {notif.type === 'INFO' && <Info className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${notif.read ? 'text-olive dark:text-white' : 'text-orange-900 dark:text-orange-400'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs font-medium text-olive/70 dark:text-off-white/60 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <Link 
                          href={notif.link}
                          onClick={() => { markAsRead(notif.id); setIsOpen(false); }}
                          className="inline-block mt-2 text-xs font-black text-kalahari hover:underline"
                        >
                          View Details &rarr;
                        </Link>
                      )}
                    </div>
                    {!notif.read && (
                      <button onClick={() => markAsRead(notif.id)} className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}