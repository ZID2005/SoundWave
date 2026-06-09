import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const apiKey = process.env.CALLMEBOT_API_KEY || process.env.NEXT_PUBLIC_CALLMEBOT_API_KEY;
    if (!apiKey) {
      console.error(`[${timestamp}] [WhatsApp Proxy Error] CALLMEBOT_API_KEY is not configured.`);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    // CallMeBot WhatsApp parameters
    const phone = "919567931330";
    const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(waUrl, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${timestamp}] [WhatsApp Proxy Error] CallMeBot API failed:`, errorText);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[${timestamp}] [WhatsApp Proxy Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
