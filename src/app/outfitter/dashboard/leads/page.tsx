"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, MessageSquare, Target, User, Archive, ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import KuduLoader from "@/components/ui/KuduLoader";

interface Inquiry {
  id: string;
  huntId: string;
  huntTitle: string;
  hunterId: string;
  hunterName?: string;
  status: "NEW" | "REVIEWED" | "BOOKED" | "ARCHIVED" | "LOST";
  createdAt: string;
}

export default function OutfitterLeads() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activeTab, setActiveTab] = useState<"NEW" | "REVIEWED" | "BOOKED" | "ARCHIVED">("NEW");

  const fetchLeads = async () => {
    if (!auth.currentUser) return;

    try {
      const inquiriesRef = collection(db, "inquiries");
      const q = query(inquiriesRef, where("outfitterId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedInquiries = await Promise.all(querySnapshot.docs.map(async (inquiryDoc) => {
        const data = inquiryDoc.data();
        let hunterName = "Unknown Hunter";
        
        if (data.hunterId) {
          const hunterSnap = await getDoc(doc(db, "users", data.hunterId));
          if (hunterSnap.exists()) hunterName = hunterSnap.data().name || "Hunter";
        }

        return {
          id: inquiryDoc.id,
          hunterName,
          ...data
        } as Inquiry;
      }));

      fetchedInquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInquiries(fetchedInquiries);
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchLeads();
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const updateInquiryStatus = async (inquiryId: string, newStatus: Inquiry["status"]) => {
    try {
      await updateDoc(doc(db, "inquiries", inquiryId), { status: newStatus });
      setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (loading) return <KuduLoader />;

  const filteredInquiries = inquiries.filter(i => i.status === activeTab);
  
  const stats = {
    NEW: inquiries.filter(i => i.status === "NEW").length,
    REVIEWED: inquiries.filter(i => i.status === "REVIEWED").length,
    BOOKED: inquiries.filter(i => i.status === "BOOKED").length,
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="border-b-2 border-kalahari/30 pb-6 flex items-center gap-4">
        <Link href="/outfitter/dashboard" className="p-2 bg-white border-2 border-kalahari/20 rounded-lg hover:border-kalahari transition-colors">
          <ArrowLeft className="h-6 w-6 text-olive dark:text-off-white" />
        </Link>
        <div>
          <h1 className="text-4xl font-headline font-bold text-olive dark:text-off-white tracking-tight">Lead Management</h1>
          <p className="text-olive dark:text-off-white/70 mt-2 text-lg font-medium">
            Track inquiries, communicate with hunters, and secure bookings.
          </p>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["NEW", "REVIEWED", "BOOKED"] as const).map((status) => (
          <Card 
            key={status}
            onClick={() => setActiveTab(status)}
            className={`border-2 shadow-sm rounded-2xl p-6 cursor-pointer transition-all ${
              activeTab === status ? "border-kalahari bg-white shadow-md" : "border-kalahari/20 bg-white/60 hover:border-kalahari/50"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-olive dark:text-off-white/60 uppercase tracking-widest mb-1">{status} LEADS</p>
                <p className="text-4xl font-black text-olive dark:text-off-white">{stats[status]}</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${activeTab === status ? "bg-kalahari/20" : "bg-kalahari/10"}`}>
                {status === "NEW" && <Clock className="h-6 w-6 text-kalahari" />}
                {status === "REVIEWED" && <MessageSquare className="h-6 w-6 text-kalahari" />}
                {status === "BOOKED" && <CheckCircle className="h-6 w-6 text-kalahari" />}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Inbox Area */}
      <div className="bg-white border-2 border-kalahari/20 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-black font-headline text-olive dark:text-off-white flex items-center gap-3">
            <Target className="h-6 w-6 text-kalahari" /> 
            {activeTab === "NEW" ? "New Requests" : activeTab === "REVIEWED" ? "In Discussion" : activeTab === "BOOKED" ? "Secured Hunts" : "Archived Leads"}
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setActiveTab("ARCHIVED")}
            className={`text-xs font-bold uppercase tracking-wider ${activeTab === "ARCHIVED" ? "text-kalahari bg-kalahari/10" : "text-olive dark:text-off-white/50 hover:text-olive dark:text-off-white hover:bg-slate-100"}`}
          >
            <Archive className="h-4 w-4 mr-1.5" /> View Archive
          </Button>
        </div>

        {filteredInquiries.length === 0 ? (
          <div className="text-center py-12 bg-off-white border-2 border-dashed border-kalahari/30 rounded-xl">
            <p className="text-olive dark:text-off-white/60 font-bold">No leads in this pipeline stage.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <div 
                key={inquiry.id} 
                onClick={() => router.push(`/hunts/${inquiry.huntId}`)}
                className={`cursor-pointer border-2 rounded-xl p-5 hover:border-kalahari/50 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group ${
                  activeTab === "ARCHIVED" ? "border-slate-200 bg-slate-50 opacity-80 hover:opacity-100" : "border-kalahari/10 bg-slate-50/50"
                }`}
              >
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center gap-1.5">
                      <User className="h-3 w-3" /> {inquiry.hunterName}
                    </span>
                    <span className="text-[11px] font-bold text-olive dark:text-off-white/50">
                      Requested: {new Date(inquiry.createdAt).toLocaleDateString()}
                    </span>
                    {activeTab === "ARCHIVED" && (
                       <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase tracking-widest">
                         Archived
                       </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-headline text-olive dark:text-off-white leading-tight mb-1 group-hover:text-kalahari transition-colors">
                    {inquiry.huntTitle}
                  </h3>
                  <p className="text-xs text-olive dark:text-off-white/60 font-medium">Click to view hunt details</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {activeTab === "NEW" && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateInquiryStatus(inquiry.id, "REVIEWED");
                      }} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                    >
                      Acknowledge & Discuss
                    </Button>
                  )}

                  {activeTab === "REVIEWED" && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateInquiryStatus(inquiry.id, "BOOKED");
                      }} 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
                    >
                      Mark as Booked
                    </Button>
                  )}

                  {/* Archive Button: Visible on NEW, REVIEWED, and BOOKED */}
                  {(activeTab === "NEW" || activeTab === "REVIEWED" || activeTab === "BOOKED") && (
                    <Button 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to archive this lead?")) {
                           updateInquiryStatus(inquiry.id, "ARCHIVED");
                        }
                      }} 
                      className="w-full sm:w-auto text-slate-400 hover:text-red-600 hover:bg-red-50 z-10 relative" 
                      title={activeTab === "BOOKED" ? "Move Completed Hunt to Archive" : "Archive Request"}
                    >
                      {activeTab === "BOOKED" ? <Trash2 className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
                    </Button>
                  )}

                  {/* Restore Button: Only visible when in ARCHIVED tab */}
                  {activeTab === "ARCHIVED" && (
                     <Button 
                     variant="outline" 
                     onClick={(e) => {
                       e.stopPropagation();
                       updateInquiryStatus(inquiry.id, "REVIEWED");
                     }} 
                     className="w-full text-slate-600 border-slate-300 hover:bg-slate-100 font-bold shadow-sm z-10 relative" 
                     title="Restore to active pipeline"
                   >
                     <RotateCcw className="h-4 w-4 mr-2" /> Restore Lead
                   </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}