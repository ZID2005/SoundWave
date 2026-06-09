import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { buildYourSoundSchema } from "@/lib/schemas";
import { writeDocument, deleteDocument, adminDb } from "@/lib/firebase-admin";
import fs from "fs";
import path from "path";

// 1. POST: Save configuration
export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/saved-builds (POST)";

  try {
    const userPayload = await verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 401 });
    }

    const body = await req.json();

    // Validate specs
    const validationResult = buildYourSoundSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] Validation failed for user ${userPayload.uid}:`, validationResult.error.format());
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { type, technology, tier, finish, notes, buildName, fileUrl } = validationResult.data;

    const payload = {
      userId: userPayload.uid,
      name: buildName || `Custom ${type}`,
      type,
      technology,
      tier,
      finish: type === "Sound System" ? "N/A" : finish,
      notes,
      fileUrl: fileUrl || null,
    };

    const docId = await writeDocument("savedBuilds", payload);

    return NextResponse.json({ success: true, id: docId });
  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// 2. DELETE: Delete user configuration
export async function DELETE(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/saved-builds (DELETE)";

  try {
    const userPayload = await verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let buildId = searchParams.get("id");

    if (!buildId) {
      const body = await req.json().catch(() => ({}));
      buildId = body.id;
    }

    if (!buildId || typeof buildId !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Authorization check: read doc to verify user ownership
    let isAuthorized = false;
    const db = adminDb();

    if (db) {
      const docSnap = await db.collection("savedBuilds").doc(buildId).get();
      if (docSnap.exists && docSnap.data()?.userId === userPayload.uid) {
        isAuthorized = true;
      }
    } else {
      // Local JSON fallback check
      const localDbPath = path.join(process.cwd(), "local_db.json");
      if (fs.existsSync(localDbPath)) {
        try {
          const dbContent = JSON.parse(fs.readFileSync(localDbPath, "utf8"));
          const items = dbContent["savedBuilds"] || [];
          const item = items.find((it: { id: string; userId: string }) => it.id === buildId);
          if (item && item.userId === userPayload.uid) {
            isAuthorized = true;
          }
        } catch (err) {
          console.error("Local JSON auth check error:", err);
        }
      }
    }

    if (!isAuthorized) {
      console.warn(`[${timestamp}] [${routeInfo} Unauthorized] User ${userPayload.uid} attempted to delete build ${buildId}`);
      return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    }

    // Perform deletion
    const success = await deleteDocument("savedBuilds", buildId);
    if (!success) {
      throw new Error(`Failed to delete saved build: ${buildId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
