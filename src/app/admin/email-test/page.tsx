"use client";

import { useState } from "react";
import { Mail, Send, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/firebase/client"; // Import Firebase auth client

export default function AdminEmailTester() {
  const [toEmail, setToEmail] = useState("onlyhuntssupport@gmail.com");
  const [subject, setSubject] = useState("System Ping: Manual Override");
  const [messageTitle, setMessageTitle] = useState("Admin Notification");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; text: string }>({ type: "idle", text: "" });

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail || !subject || !messageBody) return;

    setIsSending(true);
    setStatus({ type: "idle", text: "" });

    try {
      // 1. Verify the user is logged in
      const user = auth.currentUser;
      if (!user) {
        setStatus({ type: "error", text: "Authentication Error: You must be logged in to dispatch emails." });
        setIsSending(false);
        return;
      }

      // 2. Retrieve their secure, temporary ID token
      const idToken = await user.getIdToken(true);

      // 3. Dispatch the request with the token attached in the headers
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}` // The VIP Pass
        },
        body: JSON.stringify({
          to: toEmail,
          subject: subject,
          userName: "Admin User",
          title: messageTitle,
          message: messageBody,
          ctaText: "Acknowledge Message",
          ctaLink: "https://www.only-hunts.com/login",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({ type: "success", text: "Message dispatched successfully. Check the Resend dashboard or the recipient inbox." });
        setMessageBody(""); // Clear message on success
      } else {
        setStatus({ type: "error", text: `Dispatch failed: ${data.error || "Unknown server error"}` });
      }
    } catch (error) {
      console.error("Test failed:", error);
      setStatus({ type: "error", text: "Network error. Failed to communicate with the Next.js API route." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 flex flex-col h-full overflow-y-auto w-full relative">
      
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold text-olive/60 dark:text-off-white/60 hover:text-kalahari transition-colors mb-4">
          <ArrowLeft className="h-3 w-3 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-black text-olive dark:text-off-white uppercase flex items-center gap-3">
          <Mail className="h-8 w-8 text-kalahari" /> Email Dispatcher
        </h1>
        <p className="text-sm text-olive/60 dark:text-off-white/60 font-medium mt-2 max-w-2xl">
          Manually test the Resend API engine or push custom administrative notifications to specific users. All emails sent from this module will use the official Only-Hunts React template.
        </p>
      </div>

      {/* Main Form Area */}
      <div className="max-w-3xl bg-white dark:bg-stone-900 border-2 border-kalahari/20 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Status Banner */}
        {status.type !== "idle" && (
          <div className={`p-4 border-b flex items-center gap-3 ${
            status.type === "success" 
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" 
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}>
            {status.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-bold">{status.text}</p>
          </div>
        )}

        <form onSubmit={handleSendTestEmail} className="p-6 sm:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recipient Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-olive/50 dark:text-off-white/50">Recipient Email</label>
              <input 
                type="email" 
                required 
                value={toEmail} 
                onChange={(e) => setToEmail(e.target.value)}
                disabled={isSending}
                className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white"
              />
            </div>

            {/* Email Subject */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-olive/50 dark:text-off-white/50">Subject Line</label>
              <input 
                type="text" 
                required 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
                className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white"
              />
            </div>
          </div>

          {/* Internal Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-olive/50 dark:text-off-white/50">Template Header Title</label>
            <input 
              type="text" 
              required 
              value={messageTitle} 
              onChange={(e) => setMessageTitle(e.target.value)}
              disabled={isSending}
              className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white"
              placeholder="e.g. Action Required, System Update"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-olive/50 dark:text-off-white/50">Message Body</label>
            <textarea 
              required 
              rows={6}
              value={messageBody} 
              onChange={(e) => setMessageBody(e.target.value)}
              disabled={isSending}
              className="w-full px-4 py-3 bg-off-white dark:bg-stone-950 border border-kalahari/20 rounded-xl text-sm font-medium focus:ring-2 focus:ring-kalahari outline-none text-olive dark:text-off-white resize-none"
              placeholder="Type the main content of the email here..."
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={isSending || !toEmail || !subject || !messageBody} 
              className="h-12 bg-kalahari hover:bg-kalahari/90 text-white font-black rounded-xl px-8 shadow-lg transition-all"
            >
              {isSending ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Dispatching...</>
              ) : (
                <><Send className="h-5 w-5 mr-2" /> Send Test Email</>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}