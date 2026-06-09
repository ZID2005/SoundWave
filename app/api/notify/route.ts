import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/notify";

  try {
    const body = await req.json();
    const { type, buildDetails, channels } = body;

    if (type !== "custom_build" || !buildDetails) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      buildName,
      type: buildType,
      technology,
      tier,
      finish,
      notes,
      fileUrl,
    } = buildDetails;

    const priceRangeMap: Record<string, string> = {
      Essential: "₹25,000 – ₹35,000",
      Premium: "₹75,000 – ₹2,00,000",
      APEX: "₹2,00,000+",
    };
    const priceRange = priceRangeMap[tier] || "N/A";

    const formattedNotes = notes ? notes.trim() : "None";
    const formattedFileUrl = fileUrl || "None";

    let whatsappSuccess = false;
    let emailSuccess = false;

    // Determine which channels to send to
    const targetChannels = channels || ["whatsapp", "email"];

    // 1. Send WhatsApp via Twilio
    if (targetChannels.includes("whatsapp")) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;

      const messageText = `🔊 NEW CUSTOM BUILD SUBMISSION - SOUNDWAVE\n\n` +
        `👤 Customer: ${customerName}\n` +
        `📧 Email: ${customerEmail}\n` +
        `📞 Phone: ${customerPhone}\n\n` +
        `🎛️ BUILD DETAILS:\n` +
        `• Name: ${buildName}\n` +
        `• Type: ${buildType}\n` +
        `• Technology: ${technology}\n` +
        `• Tier: ${tier} (${priceRange})\n` +
        `• Finish: ${finish}\n` +
        `• Notes: ${formattedNotes}\n` +
        `• Image: ${formattedFileUrl}\n\n` +
        `📅 Date: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

      if (accountSid && authToken && fromNumber) {
        try {
          const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const formattedFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
          
          const twilioBody = new URLSearchParams({
            To: "whatsapp:+919567931330",
            From: formattedFrom,
            Body: messageText,
          });

          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: twilioBody.toString(),
          });

          if (res.ok) {
            whatsappSuccess = true;
          } else {
            const errText = await res.text();
            console.error(`[${timestamp}] [${routeInfo}] Twilio API returned error:`, errText);
          }
        } catch (twilioErr) {
          console.error(`[${timestamp}] [${routeInfo}] Twilio dispatch failed:`, twilioErr);
        }
      } else {
        console.log(`[${timestamp}] [${routeInfo} Mock Twilio] Credentials missing. Message:`, messageText);
        whatsappSuccess = true; // Fallback to success for mockup/local development flow
      }
    }

    // 2. Send Email via EmailJS REST API
    if (targetChannels.includes("email")) {
      const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID;
      const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY;
      const privateKey = process.env.EMAILJS_PRIVATE_KEY;

      const templateParams = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        subject: `New Custom Build — ${customerName} — ${buildName} — ${priceRange}`,
        order_items: `• Configuration Name: ${buildName}
Type: ${buildType}
Technology: ${technology}
Tier: ${tier} (Price Range: ${priceRange})
Finish: ${finish}
Special Notes: ${formattedNotes}
Reference Image: ${formattedFileUrl}`,
        grand_total: priceRange,
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        to_email: "soundwave31330@gmail.com",
      };

      if (serviceID && templateID && publicKey) {
        try {
          const emailJsBody = {
            service_id: serviceID,
            template_id: templateID,
            user_id: publicKey,
            template_params: templateParams,
            ...(privateKey ? { accessToken: privateKey } : {}),
          };

          const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailJsBody),
          });

          if (res.ok) {
            emailSuccess = true;
          } else {
            const errText = await res.text();
            console.error(`[${timestamp}] [${routeInfo}] EmailJS API returned error:`, errText);
          }
        } catch (emailJsErr) {
          console.error(`[${timestamp}] [${routeInfo}] EmailJS server dispatch failed:`, emailJsErr);
        }
      } else {
        console.log(`[${timestamp}] [${routeInfo} Mock EmailJS] Keys missing. Params:`, templateParams);
        emailSuccess = true; // Fallback to success for mockup/local development flow
      }
    }

    return NextResponse.json({
      success: true,
      whatsappSuccess,
      emailSuccess,
    });

  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({
      success: false,
      whatsappSuccess: false,
      emailSuccess: false,
      error: error instanceof Error ? error.message : "Internal server error",
    }, { status: 200 }); // Always return 200 to fail gracefully as per requirement
  }
}
