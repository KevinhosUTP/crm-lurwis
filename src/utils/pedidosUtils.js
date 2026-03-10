// ─────────────────────────────────────────────────────────────────────────────
// src/utils/pedidosUtils.js
// Utilidades de UI para parsear / mostrar datos de pedidos
// ─────────────────────────────────────────────────────────────────────────────

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

