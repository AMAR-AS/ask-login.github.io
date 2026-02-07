import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

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
    const { email } = await req.json()

    // 2. Load your Firebase Secret from the vault
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}')
    
    // 3. Manually sign the JWT (Fixes the SDK_VERSION crash)
    const privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256')
    
    const customToken = await new jose.SignJWT({ uid: email })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setIssuer(serviceAccount.client_email)
      .setSubject(serviceAccount.client_email)
      .setAudience("https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit")
      .setExpirationTime('1h')
      .sign(privateKey)

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