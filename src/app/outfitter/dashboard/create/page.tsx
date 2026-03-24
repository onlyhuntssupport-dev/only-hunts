"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { getOutfitterStats } from "@/app/actions/outfitter-dashboard";
import HuntCreator from "@/components/dashboard/HuntCreator";
import { Loader2 } from "lucide-react";

export default function CreateHuntPage() {
    const [loading, setLoading] = useState(true);
    const [outfitterId, setOutfitterId] = useState<string | null>(null);
    const [outfitterName, setOutfitterName] = useState("Unnamed Outfitter");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setOutfitterId(user.uid);
                try {
                    const res = await getOutfitterStats(user.uid);
                    if (res && res.success && res.data) {
                        setOutfitterName(res.data.name);
                    }
                } catch (error) {
                    console.error("Failed to fetch outfitter stats:", error);
                }
                setLoading(false);
            }
            // If no user is found immediately, we DO NOTHING and keep loading!
            // We trust the Next.js Middleware to handle actual unauthenticated users.
        });

        return () => unsubscribe();
    }, []);

    if (loading || !outfitterId) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-stone-400" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl py-8">
             <div className="mb-8">
                <h1 className="text-3xl font-bold font-headline text-stone-900">Create a New Hunt</h1>
                <p className="text-stone-500 mt-2">
                    Fill out the form below to add a new package to your outfitter profile.
                </p>
            </div>
            <HuntCreator outfitterId={outfitterId} outfitterName={outfitterName} />
        </div>
    );
}