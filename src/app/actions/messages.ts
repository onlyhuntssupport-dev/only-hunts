"use server";

import { adminDb } from "@/lib/firebase/admin";

export async function getOrCreateChat(
  hunterId: string, 
  outfitterId: string, 
  huntId: string, 
  huntTitle: string,
  hunterName: string,
  outfitterName: string
) {
  try {
    const chatsRef = adminDb.collection("chats");

    // 1. Check if a chat already exists for this exact hunter, outfitter, and hunt
    const snapshot = await chatsRef
      .where("participants", "array-contains", hunterId)
      .where("huntId", "==", huntId)
      .get();

    let existingChatId = null;

    // Verify the outfitter is actually the other participant
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(outfitterId)) {
        existingChatId = doc.id;
      }
    });

    if (existingChatId) {
      return { success: true, chatId: existingChatId };
    }

    // 2. If no chat exists, create a brand new room
    const newChatData = {
      participants: [hunterId, outfitterId],
      huntId: huntId,
      huntTitle: huntTitle,
      hunterName: hunterName,
      outfitterName: outfitterName,
      lastMessage: "Conversation started",
      unreadCount: {
        [hunterId]: 0,
        [outfitterId]: 0
      },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await chatsRef.add(newChatData);
    
    return { success: true, chatId: docRef.id };

  } catch (error) {
    console.error("Error getting or creating chat:", error);
    return { success: false, error: "Failed to initialize chat room." };
  }
}