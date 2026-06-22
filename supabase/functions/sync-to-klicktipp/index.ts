import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface SyncRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  tag: string;
  list_id?: string;
}

interface SyncResponse {
  success: boolean;
  klicktipp_id?: string;
  tag?: string;
  error?: string;
  timestamp: string;
}

const KLICKTIPP_USERNAME = Deno.env.get("KLICKTIPP_USERNAME") || "bosydadaq-api2";
const KLICKTIPP_PASSWORD = Deno.env.get("KLICKTIPP_PASSWORD") || "Sentinel?!1";
const KLICKTIPP_API_URL = Deno.env.get("KLICKTIPP_API_URL") || "https://api.klicktipp.com";

async function getSessionId(): Promise<string> {
  console.log("[KlickTipp] Getting session ID...");

  const loginRes = await fetch(`${KLICKTIPP_API_URL}/account/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: KLICKTIPP_USERNAME,
      password: KLICKTIPP_PASSWORD,
    }),
  });

  if (!loginRes.ok) {
    const errorText = await loginRes.text();
    throw new Error(`Login failed (${loginRes.status}): ${errorText}`);
  }

  const loginData = await loginRes.json();
  console.log("[KlickTipp] Session ID received");
  return loginData.sessid;
}

async function getOrCreateSubscriber(
  sessionId: string,
  email: string,
  firstName: string,
  lastName: string,
  phone?: string
): Promise<string> {
  console.log(`[KlickTipp] Creating/updating subscriber: ${email}`);

  const res = await fetch(`${KLICKTIPP_API_URL}/subscriber`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId,
    },
    body: JSON.stringify({
      email,
      fields: {
        fieldFirstName: firstName,
        fieldLastName: lastName,
        ...(phone && { fieldPhone: phone }),
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Create subscriber failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  console.log(`[KlickTipp] Subscriber created: ${data.id}`);
  return data.id;
}

async function addTagToSubscriber(
  sessionId: string,
  subscriberId: string,
  tagName: string
): Promise<void> {
  console.log(`[KlickTipp] Adding tag "${tagName}" to subscriber ${subscriberId}`);

  const res = await fetch(`${KLICKTIPP_API_URL}/subscriber/${subscriberId}/add-tag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId,
    },
    body: JSON.stringify({
      tagname: tagName,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Add tag failed (${res.status}): ${errorText}`);
  }

  console.log(`[KlickTipp] Tag added successfully`);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const response: SyncResponse = {
    success: false,
    timestamp: new Date().toISOString(),
  };

  try {
    let body: SyncRequest;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error(`Invalid JSON body: ${e}`);
    }

    if (!body.email || !body.first_name || !body.last_name || !body.tag) {
      throw new Error("Required fields missing: email, first_name, last_name, tag");
    }

    console.log(`[KlickTipp] Sync started for ${body.email} with tag "${body.tag}"`);

    const sessionId = await getSessionId();

    const subscriberId = await getOrCreateSubscriber(
      sessionId,
      body.email,
      body.first_name,
      body.last_name,
      body.phone
    );

    await addTagToSubscriber(sessionId, subscriberId, body.tag);

    response.success = true;
    response.klicktipp_id = subscriberId;
    response.tag = body.tag;

    console.log(`[KlickTipp] Sync successful: ${body.email} -> ${subscriberId}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[KlickTipp] Error:", error);

    response.error = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify(response), {
      status: error instanceof Error ? 400 : 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
