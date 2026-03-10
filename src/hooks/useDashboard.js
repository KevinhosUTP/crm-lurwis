// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useDashboard.js
// KPIs y estadísticas del Dashboard — calculados desde Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getStatsDashboard } from "../services/pedidosService";

const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const getRangoDashboard = (periodo) => {
  const hoy    = startOf(new Date());
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);

  if (periodo === "Hoy")         return { desde: hoy, hasta: manana };
  if (periodo === "Esta Semana") {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1));
    return { desde: lunes, hasta: manana };
  }
  if (periodo === "Este Mes")    return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta: manana };
  return { desde: new Date(0), hasta: manana };
};

export const useDashboard = (periodo) => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rango = getRangoDashboard(periodo);
      const data  = await getStatsDashboard(rango);
      setStats(data);
    } catch (err) {
      console.error("[useDashboard]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { cargar(); }, [cargar]);

  return { stats, loading, error, recargar: cargar };
};

