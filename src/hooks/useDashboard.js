// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useDashboard.js
// KPIs y estadísticas del Dashboard — calculados desde Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getStatsDashboard, calcularStats } from "../services/pedidosService";
import { supabase } from "../lib/supabase";

const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

export const getRangoDashboard = (periodo) => {
  const hoy    = startOf(new Date());
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);

  if (periodo === "Hoy")         return { desde: hoy, hasta: manana };
  if (periodo === "Esta Semana") {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1));
    return { desde: lunes, hasta: manana };
  }
  if (periodo === "Este Mes")
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta: manana };
  return { desde: new Date(0), hasta: manana };
};

export const useDashboard = (periodo) => {
  const [todosPedidos,   setTodosPedidos]   = useState([]);
  const [nombresPlatos,  setNombresPlatos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Cargar pedidos Y nombres oficiales de la tabla platos en paralelo
      const [pedidosData, platosRes] = await Promise.all([
        getStatsDashboard(),
        supabase.from("platos").select("nombre").eq("activo", true),
      ]);
      setTodosPedidos(pedidosData);
      setNombresPlatos((platosRes.data ?? []).map((p) => p.nombre));
    } catch (err) {
      console.error("[useDashboard]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Filtrar por período en cliente (sin problemas de timezone)
  const pedidosFiltrados = (() => {
    const rango = getRangoDashboard(periodo);
    if (!rango) return todosPedidos;
    return todosPedidos.filter((p) => {
      const f = new Date(p.created_at);
      return f >= rango.desde && f < rango.hasta;
    });
  })();

  // Pasar nombres oficiales de la DB para normalizar el top 5
  const stats = loading ? null : calcularStats(pedidosFiltrados, nombresPlatos);

  return { stats, loading, error, recargar: cargar };
};
