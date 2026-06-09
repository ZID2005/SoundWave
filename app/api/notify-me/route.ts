import { NextRequest, NextResponse } from "next/server";
import { notifyMeSchema } from "@/lib/schemas";
import { writeDocument } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/notify-me";

  try {
    const body = await req.json();

    // 1. Validate inputs via Zod schema
    const validationResult = notifyMeSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] Validation failed:`, validationResult.error.format());
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { productId, productName, email, phone } = validationResult.data;

    // 2. Save document to database
    const payload = {
      productId,
      productName,
      email: email || null,
      phone: phone || null,
    };

    const docId = await writeDocument("notifyMe", payload);

    return NextResponse.json({ success: true, id: docId });
  } catch (error) {
    // Audit Requirement 8: Generic error output, full logs server-side only
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
