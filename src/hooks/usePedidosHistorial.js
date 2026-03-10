// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePedidosHistorial.js
// Historial — consulta pedidos_picanteria con filtros de fecha y pago
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getPedidosHistorial } from "../services/pedidosService";

const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const getRangoFechas = (periodo) => {
  const hoy    = startOf(new Date());
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);

  if (periodo === "Hoy")         return { desde: hoy, hasta: manana };
  if (periodo === "Esta Semana") {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1));
    return { desde: lunes, hasta: manana };
  }
  if (periodo === "Este Mes")    return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta: manana };
  if (periodo === "Mes Pasado")  return {
    desde: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1),
    hasta: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  };
  return { desde: new Date(0), hasta: manana };
};

export const usePedidosHistorial = (periodo, pagosActivos) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { desde, hasta } = getRangoFechas(periodo);
      // Mapea los estados del historial al campo real estado_pedido
      // completado → completado, cancelado → cancelado
      const data = await getPedidosHistorial({ desde, hasta, pagos: pagosActivos });
      setPedidos(data);
    } catch (err) {
      console.error("[usePedidosHistorial]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodo, pagosActivos]);

  useEffect(() => { cargar(); }, [cargar]);

  // Agrupar por estado para el Kanban del historial
  // tipo_servicio='delivery' → columna "completado" / tipo_servicio='recojo' → "recogido"
  const porEstado = {
    completado: pedidos.filter((p) => p.estado_pedido === "completado" && p.tipo_servicio === "delivery"),
    recogido:   pedidos.filter((p) => p.estado_pedido === "completado" && p.tipo_servicio === "recojo"),
    cancelado:  pedidos.filter((p) => p.estado_pedido === "cancelado"),
  };

  // Estadísticas rápidas
  const totalIngresos = pedidos
    .filter((p) => p.estado_pedido === "completado")
    .reduce((acc, p) => acc + Number(p.total_final ?? p.total_estimado ?? 0), 0);

  return { pedidos, porEstado, totalIngresos, loading, error, recargar: cargar };
};
