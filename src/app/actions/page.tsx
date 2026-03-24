"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { updatePlatformSettings } from "@/app/actions/platform";
import { Save, Loader2, Percent, DollarSign, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlatformSettings {
  commissionRate: number;
  flatFee: number;
  supportEmail: string;
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionRate: 0,
    flatFee: 0,
    supportEmail: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "system", "settings");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as PlatformSettings;
          setSettings({
            commissionRate: data.commissionRate || 0,
            flatFee: data.flatFee || 0,
            supportEmail: data.supportEmail || "",
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updatePlatformSettings(formData);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Platform settings updated successfully." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-2">Manage global business rules, fees, and contact information.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Financial Rules</h3>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Platform Commission Rate (%)</label>
              <p className="text-xs text-muted-foreground mb-1">The percentage Only-Hunts takes from each successful booking.</p>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  name="commissionRate" 
                  step="0.1" 
                  min="0" 
                  max="100" 
                  className="pl-9" 
                  defaultValue={settings.commissionRate} 
                  required 
                />
              </div>
            </div>

            <div className="grid gap-2 mt-4">
              <label className="text-sm font-medium">Flat Booking Fee (ZAR)</label>
              <p className="text-xs text-muted-foreground mb-1">A static fee applied to every transaction (if applicable).</p>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  name="flatFee" 
                  step="0.01" 
                  min="0" 
                  className="pl-9" 
                  defaultValue={settings.flatFee} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold border-b pb-2">Global Contact Info</h3>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Global Support Email</label>
              <p className="text-xs text-muted-foreground mb-1">Where automated replies and user inquiries will be directed.</p>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  name="supportEmail" 
                  className="pl-9" 
                  defaultValue={settings.supportEmail} 
                  required 
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-50 text-emerald-700'}`}>
              {message.text}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}