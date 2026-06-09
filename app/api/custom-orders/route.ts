import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { buildYourSoundSchema } from "@/lib/schemas";
import { writeDocument } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/custom-orders";

  try {
    // 1. Verify User Auth Token
    const userPayload = await verifyToken(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 401 });
    }

    const body = await req.json();

    // 2. Validate input via Zod schema
    const validationResult = buildYourSoundSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${timestamp}] [${routeInfo} Warning] Validation failed for user ${userPayload.uid}:`, validationResult.error.format());
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { type, technology, tier, finish, notes, buildName, fileUrl } = validationResult.data;

    // 3. Write Custom Order to Firestore
    const orderData = {
      userId: userPayload.uid,
      userEmail: userPayload.email || null,
      userPhone: userPayload.phone_number || null,
      type,
      technology,
      tier,
      finish: type === "Sound System" ? "N/A" : finish,
      notes,
      buildName: buildName || `Custom ${type}`,
      fileUrl: fileUrl || null,
      status: "pending",
    };

    const docId = await writeDocument("customOrders", orderData);

    // 4. Send CallMeBot WhatsApp Notification (Silently from server)
    const priceRangeMap: Record<string, string> = {
      Essential: "₹25K-₹35K",
      Premium: "₹75K-₹2L",
      APEX: "₹2L+",
    };

    const dateStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const waLines = [
      "🔊 NEW CUSTOM BUILD - SOUNDWAVE",
      "",
      `👤 Customer: ${userPayload.name || userPayload.email || "N/A"}`,
      `📞 Phone: ${userPayload.phone_number || userPayload.email || "N/A"}`,
      "",
      "🎛️ BUILD DETAILS:",
      `• Product Type: ${type}`,
      `• Technology: ${technology}`,
      `• Tier: ${tier}`,
      `• Price Range: ${priceRangeMap[tier] || "N/A"}`,
      `• Color: ${type === "Sound System" ? "N/A" : (finish || "N/A")}`,
      `• Special Requirements: ${notes.trim() || "None"}`,
      `• Reference Images: ${fileUrl ? "Uploaded (" + fileUrl + ")" : "Not uploaded"}`,
      "",
      `📅 Submitted: ${dateStr}`,
      "",
      "💬 Customer has agreed to negotiate final pricing.",
      "⚡ Check Firebase for reference images and full details.",
    ];

    const waMessage = waLines.join("\n");
    const waApiKey = process.env.CALLMEBOT_API_KEY || process.env.NEXT_PUBLIC_CALLMEBOT_API_KEY;

    if (waApiKey) {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=919567931330&text=${encodeURIComponent(waMessage)}&apikey=${waApiKey}`;
      
      // Fire and forget fetch request
      fetch(waUrl, { mode: "no-cors" }).catch((err) => {
        console.error(`[${timestamp}] [WhatsApp Dispatch Error]`, err);
      });
    } else {
      console.warn(`[${timestamp}] [WhatsApp Dispatch Ignored] CALLMEBOT_API_KEY is not configured.`);
    }

    return NextResponse.json({ success: true, id: docId });
  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
