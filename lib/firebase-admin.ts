import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

let isInitialized = false;

export function initAdmin() {
  if (isInitialized || admin.apps.length > 0) {
    isInitialized = true;
    return admin;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "soundwave-740e7";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  try {
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        storageBucket,
      });
      console.log("[Firebase Admin] Initialized with Service Account.");
    } else {
      admin.initializeApp({
        projectId,
        storageBucket,
      });
      console.log("[Firebase Admin] Initialized with Project ID.");
    }
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed, using fallback:", error);
  }

  isInitialized = true;
  return admin;
}

export const adminDb = () => {
  initAdmin();
  try {
    return admin.firestore();
  } catch {
    console.warn("[Firebase Admin] Firestore instance unavailable.");
    return null;
  }
};

export const adminStorage = () => {
  initAdmin();
  try {
    return admin.storage();
  } catch {
    console.warn("[Firebase Admin] Storage instance unavailable.");
    return null;
  }
};

interface LocalDbDocument {
  id: string;
  [key: string]: unknown;
}

/**
 * Server-side Firestore Helper to write a document.
 * Automatically falls back to a local JSON database if Firebase config is missing.
 */
export async function writeDocument(collectionName: string, data: Record<string, unknown>) {
  const db = adminDb();
  
  // Clean payload from undefined/null values for Firestore compatibility
  const cleanData = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

  try {
    if (db) {
      const docRef = await db.collection(collectionName).add({
        ...cleanData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } else {
      throw new Error("Firestore DB instance not available.");
    }
  } catch (error) {
    console.warn(`[Firebase Admin writeDocument Failed] Falling back to local JSON:`, error);
    
    const localDbPath = path.join(process.cwd(), "local_db.json");
    let dbContent: Record<string, LocalDbDocument[]> = {};
    if (fs.existsSync(localDbPath)) {
      try {
        dbContent = JSON.parse(fs.readFileSync(localDbPath, "utf8")) as Record<string, LocalDbDocument[]>;
      } catch {
        dbContent = {};
      }
    }
    
    if (!dbContent[collectionName]) {
      dbContent[collectionName] = [];
    }
    
    const id = "local_" + Math.random().toString(36).substring(2, 11);
    const newDoc: LocalDbDocument = {
      id,
      ...cleanData,
      createdAt: new Date().toISOString(),
    };
    
    dbContent[collectionName].push(newDoc);
    fs.writeFileSync(localDbPath, JSON.stringify(dbContent, null, 2), "utf8");
    return id;
  }
}

/**
 * Server-side Firestore Helper to update a document.
 */
export async function updateDocument(collectionName: string, docId: string, data: Record<string, unknown>) {
  const db = adminDb();
  const cleanData = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

  try {
    if (db) {
      await db.collection(collectionName).doc(docId).update({
        ...cleanData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    } else {
      throw new Error("Firestore DB instance not available.");
    }
  } catch (error) {
    console.warn(`[Firebase Admin updateDocument Failed] Falling back to local JSON:`, error);
    
    const localDbPath = path.join(process.cwd(), "local_db.json");
    if (fs.existsSync(localDbPath)) {
      try {
        const dbContent = JSON.parse(fs.readFileSync(localDbPath, "utf8")) as Record<string, LocalDbDocument[]>;
        const items = dbContent[collectionName] || [];
        const index = items.findIndex((item) => item.id === docId);
        if (index !== -1) {
          items[index] = { ...items[index], ...cleanData, updatedAt: new Date().toISOString() };
          fs.writeFileSync(localDbPath, JSON.stringify(dbContent, null, 2), "utf8");
          return true;
        }
      } catch (err) {
        console.error("Local JSON update failed:", err);
      }
    }
    return false;
  }
}

/**
 * Server-side Firestore Helper to delete a document.
 */
export async function deleteDocument(collectionName: string, docId: string) {
  const db = adminDb();

  try {
    if (db) {
      await db.collection(collectionName).doc(docId).delete();
      return true;
    } else {
      throw new Error("Firestore DB instance not available.");
    }
  } catch (error) {
    console.warn(`[Firebase Admin deleteDocument Failed] Falling back to local JSON:`, error);
    
    const localDbPath = path.join(process.cwd(), "local_db.json");
    if (fs.existsSync(localDbPath)) {
      try {
        const dbContent = JSON.parse(fs.readFileSync(localDbPath, "utf8")) as Record<string, LocalDbDocument[]>;
        const items = dbContent[collectionName] || [];
        const filtered = items.filter((item) => item.id !== docId);
        dbContent[collectionName] = filtered;
        fs.writeFileSync(localDbPath, JSON.stringify(dbContent, null, 2), "utf8");
        return true;
      } catch (err) {
        console.error("Local JSON delete failed:", err);
      }
    }
    return false;
  }
}
