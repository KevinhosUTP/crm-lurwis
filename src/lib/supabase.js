// ─────────────────────────────────────────────────────────────────────────────
// src/lib/supabase.js
// Cliente único de Supabase para toda la aplicación.
// Las credenciales vienen del archivo .env (NUNCA las hardcodees aquí).
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    "[Supabase] Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY.\n" +
    "Copia .env.example → .env y rellena tus credenciales."
  );
}

// createClient es seguro de llamar con valores vacíos — solo fallará
// cuando se intente hacer una consulta real.
export const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON ?? "");

