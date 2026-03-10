// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePedidosHistorial.js
// Historial — consulta pedidos_picanteria con filtros de fecha y pago
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getPedidosHistorial } from "../services/pedidosService";

const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

export const getRangoFechas = (periodo) => {
  if (periodo === "Todo") return null; // sin filtro

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
  return null;
};

export const usePedidosHistorial = (periodo, pagosActivos) => {
  const [todosLosPedidos, setTodosLosPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const pagosKey = pagosActivos.join(",");

  // Carga TODOS los completados/cancelados sin filtro de fecha
  // El filtrado por fecha se hace en cliente para evitar problemas de timezone
  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPedidosHistorial({ pagos: pagosKey ? pagosKey.split(",") : [] });
      setTodosLosPedidos(data);
    } catch (err) {
      console.error("[usePedidosHistorial]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagosKey]);

  useEffect(() => { cargar(); }, [cargar]);

  // Filtrar en cliente por período
  const pedidos = (() => {
    const rango = getRangoFechas(periodo);
    if (!rango) return todosLosPedidos;
    return todosLosPedidos.filter((p) => {
      const f = new Date(p.created_at);
      return f >= rango.desde && f < rango.hasta;
    });
  })();

  // Agrupar: completado+delivery → "completado", completado+recojo → "recogido", cancelado → "cancelado"
  // Acepta tipo_servicio en cualquier capitalización
  const tipoEs = (p, tipo) => (p.tipo_servicio ?? "").toLowerCase() === tipo;

  const porEstado = {
    completado: pedidos.filter((p) => p.estado_pedido === "completado" && tipoEs(p, "delivery")),
    recogido:   pedidos.filter((p) => p.estado_pedido === "completado" && tipoEs(p, "recojo")),
    cancelado:  pedidos.filter((p) => p.estado_pedido === "cancelado"),
  };

  const totalIngresos = pedidos
    .filter((p) => p.estado_pedido === "completado")
    .reduce((acc, p) => acc + Number(p.total_final ?? p.total_estimado ?? 0), 0);

  return { pedidos, porEstado, totalIngresos, loading, error, recargar: cargar };
};
