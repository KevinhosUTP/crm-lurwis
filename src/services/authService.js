// ─────────────────────────────────────────────────────────────────────────────
// src/services/authService.js
// Autenticación usando Supabase Auth.
// ─────────────────────────────────────────────────────────────────────────────
// SETUP EN SUPABASE:
// 1. Ve a Authentication → Settings
// 2. En "Auth Providers" asegúrate de tener Email habilitado
// 3. Crea el usuario admin en Authentication → Users → "Invite User" o
//    directamente con: supabase.auth.admin.createUser(...)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";

// ── Iniciar sesión con email y contraseña ─────────────────────────────────────
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

// ── Cerrar sesión ─────────────────────────────────────────────────────────────
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ── Obtener sesión actual (al recargar la página) ─────────────────────────────
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// ── Escuchar cambios de sesión (para el AuthContext) ─────────────────────────
// Uso:
//   const { data: { subscription } } = onAuthStateChange((session) => {
//     setUser(session?.user ?? null);
//   });
//   return () => subscription.unsubscribe();
export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange((_event, session) => callback(session));

