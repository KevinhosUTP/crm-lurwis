// ─────────────────────────────────────────────────────────────────────────────
// src/services/pedidosService.js
// Consultas sobre la tabla real: public.pedidos_picanteria
// ─────────────────────────────────────────────────────────────────────────────
//
// ESTRUCTURA REAL DE LA TABLA:
//   id               uuid  PK
//   telefono         varchar
//   cliente_nombre   varchar
//   detalle_pedido   jsonb   ← array de items: [{nombre, cantidad, precio}]
//   total_estimado   numeric
//   total_final      numeric (nullable)
//   metodo_pago      varchar  ('Yape','Plin','Efectivo','Tarjeta')
//   tipo_servicio    varchar  ('delivery','recojo')
//   estado_pedido    varchar  ('pendiente','cocina','entregar','completado','cancelado')
//   direccion        varchar  (default 'Sin dirección')
//   created_at       timestamptz
//
// ESTADOS DEL FLUJO KANBAN:
//   pendiente → cocina → entregar → completado
//   cualquier estado → cancelado
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";

// ── Campos que el CRM necesita (evitar traer datos innecesarios) ──────────────
const CAMPOS = "id, telefono, cliente_nombre, detalle_pedido, total_estimado, total_final, metodo_pago, tipo_servicio, estado_pedido, direccion, created_at";

// ── Pedidos activos para el Kanban en vivo ────────────────────────────────────
export const getPedidosActivos = async () => {
  const { data, error } = await supabase
    .from("pedidos_picanteria")
    .select(CAMPOS)
    .in("estado_pedido", ["pendiente", "cocina", "entregar", "completado"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

// ── Pedidos del historial con filtros de fecha y método de pago ───────────────
export const getPedidosHistorial = async ({ desde, hasta, pagos = [] }) => {
  let query = supabase
    .from("pedidos_picanteria")
    .select(CAMPOS)
    .in("estado_pedido", ["completado", "cancelado"])
    .gte("created_at", desde.toISOString())
    .lt("created_at",  hasta.toISOString())
    .order("created_at", { ascending: false });

  if (pagos.length > 0) {
    query = query.in("metodo_pago", pagos);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

// ── Avanzar estado de un pedido (flujo Kanban) ────────────────────────────────
export const updateEstadoPedido = async (id, nuevoEstado) => {
  const { data, error } = await supabase
    .from("pedidos_picanteria")
    .update({ estado_pedido: nuevoEstado })
    .eq("id", id)
    .select(CAMPOS)
    .single();

  if (error) throw error;
  return data;
};

// ── Cancelar un pedido ────────────────────────────────────────────────────────
export const cancelarPedido = async (id) => {
  const { data, error } = await supabase
    .from("pedidos_picanteria")
    .update({ estado_pedido: "cancelado" })
    .eq("id", id)
    .select(CAMPOS)
    .single();

  if (error) throw error;
  return data;
};

// ── Estadísticas para el Dashboard ───────────────────────────────────────────
export const getStatsDashboard = async ({ desde, hasta }) => {
  const { data, error } = await supabase
    .from("pedidos_picanteria")
    .select("total_final, total_estimado, estado_pedido, metodo_pago, tipo_servicio, detalle_pedido")
    .gte("created_at", desde.toISOString())
    .lt("created_at",  hasta.toISOString());

  if (error) throw error;
  const pedidos = data ?? [];

  const exitosos   = pedidos.filter((p) => p.estado_pedido !== "cancelado");
  const cancelados = pedidos.filter((p) => p.estado_pedido === "cancelado");

  // Ingresos: usa total_final si existe, si no total_estimado
  const totalIngresos = exitosos.reduce(
    (acc, p) => acc + Number(p.total_final ?? p.total_estimado ?? 0), 0
  );

  const ticketPromedio = exitosos.length > 0
    ? totalIngresos / exitosos.length
    : 0;

  const tasaExito = pedidos.length > 0
    ? Math.round((exitosos.length / pedidos.length) * 100)
    : 0;

  // Top platos: extraer del jsonb detalle_pedido
  const conteoPlatos = {};
  exitosos.forEach((p) => {
    const items = Array.isArray(p.detalle_pedido) ? p.detalle_pedido : [];
    items.forEach((item) => {
      const nombre = item.nombre ?? item.name ?? "Desconocido";
      conteoPlatos[nombre] = (conteoPlatos[nombre] ?? 0) + (item.cantidad ?? item.quantity ?? 1);
    });
  });
  const topPlatos = Object.entries(conteoPlatos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nombre, unidades]) => ({ nombre, unidades }));

  // Distribución por método de pago
  const porPago = {};
  exitosos.forEach((p) => {
    const m = p.metodo_pago ?? "Otro";
    porPago[m] = (porPago[m] ?? 0) + 1;
  });

  // Distribución por tipo de servicio
  const delivery = exitosos.filter((p) => p.tipo_servicio === "delivery").length;
  const recojo   = exitosos.filter((p) => p.tipo_servicio === "recojo").length;

  return {
    totalIngresos,
    ticketPromedio,
    tasaExito,
    totalPedidos:    pedidos.length,
    pedidosExitosos: exitosos.length,
    cancelados:      cancelados.length,
    topPlatos,
    porPago,
    delivery,
    recojo,
  };
};

// ── Últimos N pedidos para la tabla del Dashboard ─────────────────────────────
export const getUltimosPedidos = async (limite = 5) => {
  const { data, error } = await supabase
    .from("pedidos_picanteria")
    .select(CAMPOS)
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return data ?? [];
};

