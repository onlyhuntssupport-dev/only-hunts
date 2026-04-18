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
    
    const confirmed = window.confirm("DANGER: This will permanently delete your hunter profile. You will lose all access to the platform immediately. Proceed?");
    if (!confirmed) return;

    try {
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
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-kalahari" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black font-headline tracking-tight text-olive dark:text-off-white transition-colors">Profile Settings</h1>
        <p className="text-olive/70 dark:text-off-white/60 font-medium mt-2 transition-colors">Manage your hunter profile and security preferences.</p>
      </div>

      <div className="rounded-2xl border-2 border-kalahari/20 bg-white dark:bg-stone-900 shadow-sm overflow-hidden transition-colors">
        <form onSubmit={handleSaveProfile} className="p-8 space-y-8">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded-full border-4 border-kalahari/20 bg-stone-100 dark:bg-stone-800 flex items-center justify-center overflow-hidden group transition-colors">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-olive/30 dark:text-off-white/30" />
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <div>
              <h3 className="font-black text-olive dark:text-off-white transition-colors">Profile Picture</h3>
              <p className="text-sm font-medium text-olive/70 dark:text-off-white/60 transition-colors">Click the image to upload a new avatar.</p>
            </div>
          </div>

          <hr className="border-kalahari/20 transition-colors" />

          {/* Details Section */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Full Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. John Doe"
                required 
                className="max-w-md h-12 border-kalahari/40 focus-visible:ring-kalahari bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">Email Address (Read-only)</label>
              <Input value={email} disabled className="bg-stone-100 dark:bg-stone-800/50 max-w-md text-olive/50 dark:text-off-white/50 border-kalahari/20 transition-colors" />
            </div>
          </div>

          <hr className="border-kalahari/20 transition-colors" />

          {/* Security Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-black text-olive dark:text-off-white flex items-center gap-2 transition-colors"><Lock className="h-4 w-4 text-kalahari"/> Security</h3>
              <p className="text-sm font-medium text-olive/70 dark:text-off-white/60 transition-colors">Leave blank if you do not want to change your password.</p>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-bold text-olive dark:text-off-white transition-colors">New Password</label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="••••••••"
                minLength={6}
                className="max-w-md h-12 border-kalahari/40 focus-visible:ring-kalahari bg-off-white dark:bg-black/50 dark:text-white transition-colors"
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold transition-colors ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving} className="bg-olive dark:bg-kalahari hover:bg-olive/90 dark:hover:bg-kalahari/90 text-kalahari dark:text-olive font-black h-12 px-8 shadow-md transition-all rounded-xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-950/20 border-t-2 border-red-100 dark:border-red-900/50 p-8 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-red-900 dark:text-red-500 flex items-center gap-2 transition-colors">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
              </h3>
              <p className="text-sm font-medium text-red-700/80 dark:text-red-400/80 mt-1 max-w-md transition-colors">
                Permanently delete your hunter profile and remove all platform access. This action cannot be undone.
              </p>
            </div>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteAccount}
              className="gap-2 font-black rounded-xl"
            >
              <Trash2 className="h-4 w-4" /> Delete Account
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}