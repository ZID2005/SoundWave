import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdminUser } from "@/lib/auth-server";
import { adminStatusUpdateSchema } from "@/lib/schemas";
import { updateDocument } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/admin/update-status";

  try {
    // 1. Verify user is authenticated
    const userPayload = await verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 401 });
    }

    // 2. Authorize user (Must be Admin)
    if (!isAdminUser(userPayload.uid)) {
      console.warn(`[${timestamp}] [${routeInfo} Unauthorized] Non-admin user ${userPayload.uid} tried to access admin route.`);
      return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    }

    const body = await req.json();

    // 3. Validate status payload via Zod
    const validationResult = adminStatusUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] Validation failed for admin:`, validationResult.error.format());
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { id, type, status } = validationResult.data;

    // Map the schema type to the actual Firestore collection name
    const collectionMap: Record<string, string> = {
      order: "orders",
      customOrder: "customOrders",
      enquiry: "enquiries",
    };

    const collectionName = collectionMap[type];

    // 4. Update document in collection
    const success = await updateDocument(collectionName, id, { status });
    if (!success) {
      throw new Error(`Failed to update status for ${type} document ID ${id}`);
    }

    console.log(`[${timestamp}] [${routeInfo} Success] Admin updated ${type} ID ${id} status to: ${status}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
