import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/notify";

  try {
    const body = await req.json();
    const { type, customerPhone, customerName, buildDetails, orderDetails } = body;

    if (!type || (type !== "custom_build" && type !== "product_order")) {
      return NextResponse.json({ error: "Invalid request payload — type must be 'custom_build' or 'product_order'" }, { status: 400 });
    }

    // Customer phone is required for WhatsApp — skip silently if missing
    if (!customerPhone || customerPhone === "N/A" || customerPhone === "") {
      console.log(`[${timestamp}] [${routeInfo}] No customer phone number — skipping customer WhatsApp notification.`);
      return NextResponse.json({ success: true, whatsappSuccess: false, reason: "no_phone" });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    let messageText = "";

    if (type === "custom_build") {
      // ── Customer WhatsApp for Custom Build ──────────────────────────────
      if (!buildDetails) {
        return NextResponse.json({ error: "buildDetails required for custom_build type" }, { status: 400 });
      }

      const priceRangeMap: Record<string, string> = {
        Essential: "₹25,000 – ₹35,000",
        Premium: "₹75,000 – ₹2,00,000",
        APEX: "₹2,00,000+",
      };
      const priceRange = priceRangeMap[buildDetails.tier] || "N/A";

      messageText =
        `🔊 SOUNDWAVE — Build Received!\n\n` +
        `Hi ${customerName || "there"},\n\n` +
        `Your custom build has been submitted successfully!\n\n` +
        `🎛️ Configuration Summary:\n` +
        `• Type: ${buildDetails.type || "N/A"}\n` +
        `• Technology: ${buildDetails.technology || "N/A"}\n` +
        `• Tier: ${buildDetails.tier || "N/A"} (${priceRange})\n` +
        `• Color: ${buildDetails.finish || "N/A"}\n\n` +
        `✅ Our team will review your build and contact you within 24 hours to confirm pricing and next steps.\n\n` +
        `Questions? WhatsApp us: +91 95679 31330\n` +
        `or Instagram: @soundwave.gear\n\n` +
        `— Team SOUNDWAVE`;

    } else if (type === "product_order") {
      // ── Customer WhatsApp for Product Order ──────────────────────────────
      if (!orderDetails) {
        return NextResponse.json({ error: "orderDetails required for product_order type" }, { status: 400 });
      }

      const { items, totalAmount } = orderDetails;
      const orderItemsList = Array.isArray(items)
        ? items.map((item: { name: string; quantity: number; price: string }) =>
            `• ${item.name} x${item.quantity} — ${item.price}`
          ).join("\n")
        : "N/A";

      messageText =
        `🛒 SOUNDWAVE — Order Received!\n\n` +
        `Hi ${customerName || "there"},\n\n` +
        `We have received your order enquiry!\n\n` +
        `📦 Order Summary:\n` +
        `${orderItemsList}\n\n` +
        `💰 Total: ₹${totalAmount || "0"}\n\n` +
        `✅ Our team will contact you within 24 hours to confirm your order and arrange delivery and payment.\n\n` +
        `Questions? WhatsApp us: +91 95679 31330\n` +
        `or Instagram: @soundwave.gear\n\n` +
        `— Team SOUNDWAVE`;
    }

    // ── Send WhatsApp via Twilio ──────────────────────────────────────────
    let whatsappSuccess = false;

    if (accountSid && authToken && fromNumber) {
      try {
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
        const formattedFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;

        // Normalise customer phone — strip spaces, ensure + prefix
        let toPhone = customerPhone.replace(/\s/g, "");
        if (!toPhone.startsWith("+")) {
          toPhone = `+${toPhone}`;
        }
        const formattedTo = `whatsapp:${toPhone}`;

        const twilioBody = new URLSearchParams({
          To: formattedTo,
          From: formattedFrom,
          Body: messageText,
        });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: twilioBody.toString(),
          }
        );

        if (res.ok) {
          whatsappSuccess = true;
          console.log(`[${timestamp}] [${routeInfo}] ✅ Customer WhatsApp sent to ${formattedTo}`);
        } else {
          const errText = await res.text();
          console.error(`[${timestamp}] [${routeInfo}] ❌ Twilio API error:`, errText);
        }
      } catch (twilioErr) {
        console.error(`[${timestamp}] [${routeInfo}] ❌ Twilio dispatch failed:`, twilioErr);
      }
    } else {
      // Credentials missing — log and treat as success for local dev
      console.log(`[${timestamp}] [${routeInfo}] ⚠️ Twilio credentials missing — mock customer WhatsApp:`, messageText);
      whatsappSuccess = true;
    }

    return NextResponse.json({ success: true, whatsappSuccess });

  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json(
      {
        success: false,
        whatsappSuccess: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 200 } // Always 200 — never block user flow
    );
  }
}
