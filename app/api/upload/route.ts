import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { adminStorage } from "@/lib/firebase-admin";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/upload";

  try {
    // 1. Verify Authentication
    const userPayload = await verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 401 });
    }

    // 2. Extract FormData and File
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3. Size Validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] File size exceeded: ${file.size} bytes`);
      return NextResponse.json({ error: "File exceeds 5MB size limit" }, { status: 400 });
    }

    // 4. MIME Type Validation
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] Invalid MIME type: ${file.type}`);
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
    }

    // 5. Extension Validation
    const ext = path.extname(file.name).toLowerCase().substring(1);
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!allowedExtensions.includes(ext)) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] Invalid extension: ${file.name}`);
      return NextResponse.json({ error: "Invalid file extension." }, { status: 400 });
    }

    // 6. Generate UUID Filename
    const fileId = crypto.randomUUID();
    const newFilename = `${fileId}.${ext}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let publicUrl = "";

    // 7. Attempt Upload to Firebase Storage or fallback to local
    const storage = adminStorage();
    if (storage) {
      try {
        const bucket = storage.bucket();
        const fileRef = bucket.file(`custom-orders/${newFilename}`);
        
        await fileRef.save(fileBuffer, {
          metadata: { 
            contentType: file.type,
            metadata: {
              uploadedBy: userPayload.uid,
              originalName: file.name
            }
          },
        });

        // Construct standard Firebase download URL
        publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`custom-orders/${newFilename}`)}?alt=media`;
        console.log(`[${timestamp}] [${routeInfo} Success] Uploaded ${file.name} to Firebase Storage as ${newFilename}`);
      } catch (storageError) {
        console.warn(`[${timestamp}] [${routeInfo} Fallback] Firebase Storage upload failed, writing locally:`, storageError);
        publicUrl = writeLocalFallback(fileBuffer, newFilename);
      }
    } else {
      // Local fallback in development when credentials are not configured
      publicUrl = writeLocalFallback(fileBuffer, newFilename);
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * Saves the file locally inside public/uploads and returns the local access path.
 */
function writeLocalFallback(fileBuffer: Buffer, filename: string): string {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, fileBuffer);
  
  console.log(`[Local Fallback Upload] Saved file to local directory: ${filePath}`);
  return `/uploads/${filename}`;
}
