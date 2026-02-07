import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Replace the old firebase-admin import with this one:
import admin from "https://esm.sh/firebase-admin@11.0.0?target=deno"
// These headers allow your GitHub Pages site to talk to this function safely
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle "Preflight" requests (Browsers do this for security)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    // 2. Load your Firebase Secret from the vault we set up
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}')
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
    }

    // 3. Generate the Custom Token for the user
    // This token allows the user to log into ANY of your websites or your OS
    const customToken = await admin.auth().createCustomToken(email)

    return new Response(JSON.stringify({ customToken }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})