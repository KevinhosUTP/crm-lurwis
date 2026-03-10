// ─────────────────────────────────────────────────────────────────────────────
// src/services/platosService.js
// Consultas sobre las tablas reales: platos, plato_precios, categorias
// ─────────────────────────────────────────────────────────────────────────────
//
// ESTRUCTURA REAL:
//   categorias:   id (int PK), nombre (varchar), activo (bool)
//   platos:       id (int PK), categoria_id (int FK), nombre (varchar),
//                 descripcion (text), activo (bool)
//   plato_precios: id (int PK), plato_id (int FK), tamanio (varchar),
//                  precio (numeric), activo (bool)
//                  tamanio válido: 'Personal' | 'Único' | 'Familiar'
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";

// ── Obtener todas las categorías activas ──────────────────────────────────────
export const getCategorias = async () => {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre, activo")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
};

// ── Obtener platos con sus precios y categoría (JOIN) ─────────────────────────
// Retorna estructura lista para la ConfiguracionPage:
// [{ id, nombre, descripcion, activo, categoria_id, categoria_nombre,
//    precios: [{ id, tamanio, precio, activo }] }]
export const getPlatosConPrecios = async () => {
  const { data, error } = await supabase
    .from("platos")
    .select(`
      id,
      nombre,
      descripcion,
      activo,
      categoria_id,
      categorias ( nombre ),
      plato_precios ( id, tamanio, precio, activo )
    `)
    .order("categoria_id")
    .order("nombre");

  if (error) throw error;

  // Normalizar: aplanar el join de categorias
  return (data ?? []).map((p) => ({
    ...p,
    categoria_nombre: p.categorias?.nombre ?? "Sin categoría",
    precios: p.plato_precios ?? [],
  }));
};

// ── Crear un plato ────────────────────────────────────────────────────────────
export const crearPlato = async ({ nombre, descripcion, categoria_id }) => {
  const { data, error } = await supabase
    .from("platos")
    .insert({ nombre, descripcion, categoria_id, activo: true })
    .select("id, nombre, descripcion, activo, categoria_id")
    .single();
  if (error) throw error;
  return data;
};

// ── Crear precios para un plato ───────────────────────────────────────────────
// precios: [{ tamanio: 'Personal'|'Único'|'Familiar', precio: number }]
export const crearPreciosPlato = async (plato_id, precios) => {
  const rows = precios.map((p) => ({ plato_id, tamanio: p.tamanio, precio: p.precio, activo: true }));
  const { data, error } = await supabase
    .from("plato_precios")
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
};

// ── Actualizar nombre / descripción de un plato ───────────────────────────────
export const updatePlato = async (id, { nombre, descripcion }) => {
  const { data, error } = await supabase
    .from("platos")
    .update({ nombre, descripcion })
    .eq("id", id)
    .select("id, nombre, descripcion, activo, categoria_id")
    .single();
  if (error) throw error;
  return data;
};

// ── Actualizar un precio específico ──────────────────────────────────────────
export const updatePrecio = async (precioId, { precio, tamanio }) => {
  const { data, error } = await supabase
    .from("plato_precios")
    .update({ precio, tamanio })
    .eq("id", precioId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Toggle disponibilidad de un plato ─────────────────────────────────────────
export const toggleDisponibilidadPlato = async (id, activo) => {
  const { data, error } = await supabase
    .from("platos")
    .update({ activo })
    .eq("id", id)
    .select("id, activo")
    .single();
  if (error) throw error;
  return data;
};

// ── Eliminar un plato (y sus precios por CASCADE o manualmente) ───────────────
export const deletePlato = async (id) => {
  // Borrar precios primero (si no hay ON DELETE CASCADE en la FK)
  await supabase.from("plato_precios").delete().eq("plato_id", id);
  const { error } = await supabase.from("platos").delete().eq("id", id);
  if (error) throw error;
};
