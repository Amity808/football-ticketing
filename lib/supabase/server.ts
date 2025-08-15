import { createClient } from "@supabase/supabase-js"

// Accept both public and server env var names for easier configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log("🔧 Supabase config:", {
  hasUrl: Boolean(supabaseUrl),
  hasServiceKey: Boolean(supabaseServiceKey),
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseServiceKey?.length || 0,
})

let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log("✅ Supabase admin client created successfully")
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    supabaseAdmin = null
  }
} else {
  console.warn(
    "⚠️ Supabase env missing. Using fallback mode.",
    {
      hasUrl: Boolean(supabaseUrl),
      hasServiceKey: Boolean(supabaseServiceKey),
    },
  )
}

export { supabaseAdmin }
