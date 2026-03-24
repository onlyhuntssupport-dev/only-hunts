"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client"; 
import { Camera, Save, Lock, User, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) return;
      
      setEmail(auth.currentUser.email || "");
      
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || "");
          setPhotoURL(data.photoURL || "");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) loadProfile();
      else setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      let finalPhotoURL = photoURL;

      // 1. Upload new image to Firebase Storage if selected
      if (imageFile) {
        const fileRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(fileRef, imageFile);
        finalPhotoURL = await getDownloadURL(fileRef);
      }

      // 2. Update Firestore Document (Using setDoc with merge in case the doc doesn't exist yet)
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        name,
        photoURL: finalPhotoURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Update Password if provided
      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword(""); 
      }

      setMessage({ text: "Profile updated successfully.", type: "success" });
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ text: "Security requirement: Please log out and log back in to change your password.", type: "error" });
      } else {
        setMessage({ text: error.message || "Failed to update profile.", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    
    const confirmed = window.confirm("DANGER: This will permanently delete your admin account. You will lose all access to the platform immediately. Proceed?");
    if (!confirmed) return;

    try {
      // Note: In a real app, you might want to call a server action here to clean up Firestore too.
      // For immediate auth removal per request:
      await deleteUser(auth.currentUser);
      router.push("/");
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ text: "Security requirement: Please log out and log back in to delete your account.", type: "error" });
      } else {
        setMessage({ text: error.message || "Failed to delete account.", type: "error" });
      }
    }
  };

  if (loading) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-800" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Profile Settings</h1>
        <p className="text-stone-500 mt-2">Manage your admin account and security preferences.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <form onSubmit={handleSaveProfile} className="p-8 space-y-8">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded-full border-2 border-stone-200 bg-stone-100 flex items-center justify-center overflow-hidden group">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-stone-400" />
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <div>
              <h3 className="font-bold text-stone-900">Profile Picture</h3>
              <p className="text-sm text-stone-500">Click the image to upload a new avatar.</p>
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* Details Section */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-stone-700">Full Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Ruan"
                required 
                className="max-w-md"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-stone-700">Email Address (Read-only)</label>
              <Input value={email} disabled className="bg-stone-50 max-w-md text-stone-500" />
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* Security Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-stone-900 flex items-center gap-2"><Lock className="h-4 w-4 text-amber-800"/> Security</h3>
              <p className="text-sm text-stone-500">Leave blank if you do not want to change your password.</p>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-bold text-stone-700">New Password</label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="••••••••"
                minLength={6}
                className="max-w-md"
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-md text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving} className="bg-amber-800 hover:bg-amber-900 text-white gap-2 px-8">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-50/50 border-t border-red-100 p-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Danger Zone
              </h3>
              <p className="text-sm text-red-700/80 mt-1 max-w-md">
                Permanently delete your admin account and remove all platform access. This action cannot be undone.
              </p>
            </div>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteAccount}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete Account
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}