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

// ── Función pública: desglosar detalle_pedido en items individuales ───────────
// Devuelve: [{ nombre: string, cantidad: number }]
// Maneja: array de objetos jsonb, string JSON, string plano "Plato A + Plato B"
export const desglosaDetalle = (detalle) => {
  if (!detalle) return [];

  let items = [];

  if (Array.isArray(detalle)) {
    items = detalle;
  } else if (typeof detalle === "string") {
    const t = detalle.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Texto plano: "Ceviche + Chicharrón" → separar
      return t
        .split(/[+,;\/]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((nombre) => {
          const match = nombre.match(/^(\d+)\s*[xX×]\s*(.+)/);
          return match
            ? { nombre: match[2].trim(), cantidad: Number(match[1]) }
            : { nombre, cantidad: 1 };
        });
    }
  } else if (typeof detalle === "object") {
    items = [detalle];
  }

  return items.flatMap((item) => {
    if (!item) return [];

    if (typeof item === "string") {
      const match = item.trim().match(/^(\d+)\s*[xX×]\s*(.+)/);
      if (match) return [{ nombre: match[2].trim(), cantidad: Number(match[1]) }];
      return item.trim() ? [{ nombre: item.trim(), cantidad: 1 }] : [];
    }

    if (typeof item === "object") {
      const nombre = String(
        item.nombre ?? item.name ?? item.producto ?? item.plato ??
        item.item ?? item.descripcion ?? item.description ??
        item.title ?? item.titulo ??
        (Object.entries(item).find(
          ([k, v]) => typeof v === "string" &&
            !["id","tipo","unidad","moneda","estado","uuid","telefono"].includes(k.toLowerCase())
        )?.[1] ?? "")
      ).trim();

      if (!nombre) return [];

      const cantidad = Math.max(
        1,
        Number(item.cantidad ?? item.quantity ?? item.qty ?? item.unidades ?? item.cant ?? 1)
      );
      return [{ nombre, cantidad }];
    }

    return [];
  });
};

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

// ── Pedidos del historial (completados + cancelados)
// El filtrado por fecha se hace en el cliente para evitar problemas de timezone
export const getPedidosHistorial = async ({ pagos = [] } = {}) => {
  let query = supabase
    .from("pedidos_picanteria")
    .select(CAMPOS)
    .in("estado_pedido", ["completado", "cancelado"])
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
// Trae TODOS los pedidos sin filtro de fecha; el rango se aplica en el cliente
export const getStatsDashboard = async () => {
  const { data, error } = await supabase
    .from("pedidos_picanteria")
    .select("total_final, total_estimado, estado_pedido, metodo_pago, tipo_servicio, detalle_pedido, created_at");

  if (error) throw error;
  return data ?? [];
};

// ── Calcula KPIs a partir de los pedidos ya filtrados por fecha (en cliente) ─
// nombresOficiales: string[] — nombres de la tabla platos para normalizar el top
export const calcularStats = (pedidos, nombresOficiales = []) => {
  const noCancel   = pedidos.filter((p) => p.estado_pedido !== "cancelado");
  const exitosos   = noCancel; // alias — todos los no cancelados
  const cancelados = pedidos.filter((p) => p.estado_pedido === "cancelado");
  const completados = pedidos.filter((p) => p.estado_pedido === "completado");

  // Ingresos: solo pedidos completados (tienen total_final)
  const totalIngresos = completados.reduce(
    (acc, p) => acc + Number(p.total_final ?? p.total_estimado ?? 0), 0
  );

  const ticketPromedio = completados.length > 0 ? totalIngresos / completados.length : 0;

  const tasaExito = pedidos.length > 0
    ? Math.round((exitosos.length / pedidos.length) * 100)
    : 0;

  // ─── TOP PLATOS — desglose ítem a ítem ───────────────────────────────────
  // Recorre TODOS los pedidos no cancelados, desglosa cada detalle_pedido
  // en platos individuales y suma sus cantidades reales.
  // Ej: Pedido [{nombre:"Ceviche",cantidad:2},{nombre:"Chicha",cantidad:1}]
  //     → Ceviche: +2 | Chicha: +1  (no +1 por pedido completo)
  const conteoPlatos = {};
  noCancel.forEach((pedido) => {
    desglosaDetalle(pedido.detalle_pedido).forEach(({ nombre, cantidad }) => {
      if (!nombre) return;
      conteoPlatos[nombre] = (conteoPlatos[nombre] ?? 0) + cantidad;
    });
  });

  // ── Normalizar nombres contra la tabla platos oficial ────────────────────
  // Si hay nombres oficiales disponibles, cruzar cada clave de conteoPlatos
  // con los nombres reales usando:
  //   1. Coincidencia exacta (case-insensitive)
  //   2. El nombre extraído CONTIENE al nombre oficial (o viceversa)
  // Esto agrupa variaciones como "Ceviche mixto" y "ceviche mixto" bajo el mismo nombre.
  const conteoNormalizado = {};
  if (nombresOficiales.length > 0) {
    Object.entries(conteoPlatos).forEach(([nombreExtraido, cant]) => {
      const ne = nombreExtraido.toLowerCase().trim();
      // Buscar coincidencia en nombres oficiales
      const oficial = nombresOficiales.find((no) => {
        const n = no.toLowerCase().trim();
        return n === ne || ne.includes(n) || n.includes(ne);
      });
      // Usar el nombre oficial si hay match; si no, usar el extraído tal cual
      const clave = oficial ?? nombreExtraido;
      conteoNormalizado[clave] = (conteoNormalizado[clave] ?? 0) + cant;
    });
  } else {
    // Sin nombres oficiales → usar conteo tal cual
    Object.assign(conteoNormalizado, conteoPlatos);
  }

  const topPlatos = Object.entries(conteoNormalizado)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nombre, unidades]) => ({ nombre, unidades }));

  // Distribución por método de pago (solo completados)
  const porPago = {};
  completados.forEach((p) => {
    const m = p.metodo_pago ?? "Otro";
    porPago[m] = (porPago[m] ?? 0) + 1;
  });

  // Tipo de servicio — sobre TODOS los pedidos no cancelados (incluye activos)
  const delivery = noCancel.filter((p) => (p.tipo_servicio ?? "").toLowerCase() === "delivery").length;
  const recojo   = noCancel.filter((p) => (p.tipo_servicio ?? "").toLowerCase() === "recojo").length;

  // Horas pico — solo horario de atención: 9:00 a 18:00 (hora local)
  const conteoPorHora = {};
  pedidos.forEach((p) => {
    if (!p.created_at) return;
    const hora = new Date(p.created_at).getHours();
    if (hora < 9 || hora > 18) return; // fuera del horario
    conteoPorHora[hora] = (conteoPorHora[hora] ?? 0) + 1;
  });

  // Array fijo 9h → 18h (10 columnas)
  const distribucionHoras = Array.from({ length: 10 }, (_, i) => {
    const h = i + 9;
    return {
      hora:    h,
      label:   `${String(h).padStart(2, "0")}:00`,
      pedidos: conteoPorHora[h] ?? 0,
    };
  });

  const maxHora  = Math.max(...distribucionHoras.map((h) => h.pedidos), 1);
  const topHoras = [...distribucionHoras]
    .filter((h) => h.pedidos > 0)
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 3);

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
    distribucionHoras,
    topHoras,
    maxHora,
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

