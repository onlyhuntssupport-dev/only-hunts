
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { firebaseApp } from '@/firebase/config';

const storage = getStorage(firebaseApp);

/**
 * Compresses and uploads an image to a specific path in Firebase Storage.
 */
export async function uploadHuntImage(file: File, outfitterId: string): Promise<string> {
  // 1. Image Compression Options
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    // 2. Perform Compression
    const compressedFile = await imageCompression(file, options);

    // 3. Create Storage Path: /hunts/{outfitterId}/{timestamp}_{filename}
    const storageRef = ref(storage, `hunts/${outfitterId}/${Date.now()}_${file.name}`);
    
    // 4. Execute Upload
    const uploadTask = await uploadBytesResumable(storageRef, compressedFile);
    
    // 5. Return the public Download URL
    return await getDownloadURL(uploadTask.ref);
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Failed to process image.");
  }
}
