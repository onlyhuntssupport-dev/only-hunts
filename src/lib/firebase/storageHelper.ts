import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import imageCompression from "browser-image-compression";

/**
 * Universally handles file uploads. 
 * Automatically compresses images to <1MB. 
 * Safely ignores PDFs/Documents so they don't break.
 */
export async function uploadWithCompression(file: File, path: string): Promise<string> {
  let fileToUpload = file;

  // 1. Safety Check: Only compress if it's actually an image
  if (file.type.startsWith("image/")) {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    fileToUpload = await imageCompression(file, options);
  }

  // 2. Upload to Firebase
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, fileToUpload);
  
  // 3. Return the public URL
  return await getDownloadURL(storageRef);
}