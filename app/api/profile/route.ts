import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { profileUpdateSchema } from "@/lib/schemas";
import { updateDocument } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/profile";

  try {
    // 1. Verify User Auth Token
    const userPayload = await verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 401 });
    }

    const body = await req.json();

    // 2. Validate Profile Data via Zod
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] Validation failed for user ${userPayload.uid}:`, validationResult.error.format());
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { displayName } = validationResult.data;

    // 3. Update the user record in Firestore
    const success = await updateDocument("users", userPayload.uid, {
      displayName,
      email: userPayload.email || null,
      phoneNumber: userPayload.phone_number || null,
    });

    if (!success) {
      throw new Error("Failed to write to users collection.");
    }

    return NextResponse.json({ success: true, displayName });
  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
