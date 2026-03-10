// ─────────────────────────────────────────────────────────────────────────────
// src/services/webhookService.js
// Envío de eventos al servidor de webhooks (N8N / Make / Zapier).
// ─────────────────────────────────────────────────────────────────────────────
//
// FLUJO GENERAL:
//
//  Cliente WhatsApp
//       │
//       ▼
//  N8N / Make (recibe mensaje) ──► guarda en Supabase (tabla "pedidos")
//       │                              │
//       │                              ▼
//       │                     Supabase Realtime
//       │                              │
//       │                              ▼
//       └──────────────────► Este CRM (PedidosPage escucha el canal)
//
//  Este CRM también puede ENVIAR eventos de vuelta al webhook:
//  ej: cuando el admin acepta/despacha/completa un pedido → N8N → WhatsApp
//
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL    = import.meta.env.VITE_WEBHOOK_BASE_URL ?? "";
const WH_SECRET   = import.meta.env.VITE_WEBHOOK_SECRET   ?? "";

// Headers comunes para todos los webhooks salientes
const headers = () => ({
  "Content-Type": "application/json",
  "x-webhook-secret": WH_SECRET,
});

// ── Helper genérico ───────────────────────────────────────────────────────────
const sendWebhook = async (path, payload) => {
  if (!BASE_URL) {
    console.warn("[Webhook] VITE_WEBHOOK_BASE_URL no configurada. Evento no enviado:", path, payload);
    return null;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Webhook] Error ${res.status} en ${path}: ${text}`);
  }
  return res.json().catch(() => null);
};

// ─────────────────────────────────────────────────────────────────────────────
// EVENTOS SALIENTES — El CRM notifica al bot/N8N sobre cambios de estado
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helpers para normalizar campos reales de pedidos_picanteria ─────────────
const norm = (p) => ({
  pedidoId:  p.id,
  telefono:  p.telefono,
  cliente:   p.cliente_nombre,
  total:     p.total_final ?? p.total_estimado,
  tipo:      p.tipo_servicio,
  direccion: p.direccion !== "Sin dirección" ? p.direccion : null,
  timestamp: new Date().toISOString(),
});

// Pedido aceptado → N8N → WhatsApp: "Tu pedido está en preparación"
export const webhookPedidoAceptado   = (p) => sendWebhook("/webhook/pedido-aceptado",   norm(p));

// Pedido listo para entregar → N8N → WhatsApp: "Tu pedido está listo"
export const webhookPedidoListo      = (p) => sendWebhook("/webhook/pedido-listo",      norm(p));

// Pedido despachado (delivery) → N8N → WhatsApp: "Tu pedido va en camino"
export const webhookPedidoDespachado = (p) => sendWebhook("/webhook/pedido-despachado", norm(p));

// Pedido completado → N8N → registro final + mensaje de gracias
export const webhookPedidoCompletado = (p) => sendWebhook("/webhook/pedido-completado", norm(p));

// Pedido cancelado → N8N → WhatsApp: "Tu pedido fue cancelado"
export const webhookPedidoCancelado  = (p) => sendWebhook("/webhook/pedido-cancelado",  norm(p));

