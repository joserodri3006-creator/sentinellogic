import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const DIALFIRE_API_URL = Deno.env.get("DIALFIRE_API_URL") || "https://api.dialfire.com"
const DIALFIRE_API_KEY = Deno.env.get("DIALFIRE_API_KEY")!
const DIALFIRE_CAMPAIGN_ID = Deno.env.get("DIALFIRE_CAMPAIGN_ID")!
const DIALFIRE_TASK_NAME = Deno.env.get("DIALFIRE_TASK_NAME")!

interface DialfireContactPayload {
  $ref: string
  $phone?: string
  first_name?: string
  last_name?: string
  email?: string
  company_name?: string
  [key: string]: any
}

async function createDialfireContact(payload: DialfireContactPayload) {
  const url = `${DIALFIRE_API_URL}/api/campaigns/${DIALFIRE_CAMPAIGN_ID}/tasks/${DIALFIRE_TASK_NAME}/contacts/create`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIALFIRE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()

    // 409 = Conflict (Kontakt existiert bereits) — das ist OK, wir nehmen die ID
    if (res.status === 409) {
      console.log(`[Dialfire] Contact exists (409): ${text}`)
      // Extrahiere die ID aus dem Text wenn möglich
      const match = text.match(/contacts\/([A-Z0-9]+)/)
      if (match) {
        return { id: match[1] }
      }
      throw new Error(`Dialfire 409 but could not extract ID: ${text}`)
    }

    throw new Error(`Dialfire API ${res.status}: ${text}`)
  }

  return await res.json()
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { contact } = await req.json()

    if (!contact?.id) {
      return new Response("Missing contact data", { status: 400 })
    }

    const payload: DialfireContactPayload = {
      $ref: contact.id,
      $phone: contact.phone_mobile,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      company_name: contact.company_name,
    }

    const result = await createDialfireContact(payload)

    // Dialfire gibt die Kontakt-Daten in result.data.$id zurück
    const dialfireId = result.data?.$id || result.id || result.$id

    if (!dialfireId) {
      throw new Error(`Could not extract Dialfire ID from response: ${JSON.stringify(result)}`)
    }

    console.log(`✅ Contact ${contact.email} created in Dialfire (ID: ${dialfireId})`)

    return new Response(
      JSON.stringify({ success: true, dialfire_id: dialfireId }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Error:", err)
    return new Response(
      JSON.stringify({ error: String(err), success: false }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
