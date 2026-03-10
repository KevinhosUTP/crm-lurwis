// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePedidosRealtime.js
// Kanban en vivo — Supabase Realtime sobre pedidos_picanteria
// ─────────────────────────────────────────────────────────────────────────────
//
// ACTIVAR REALTIME EN SUPABASE:
//   SQL Editor → ejecutar:
//   ALTER PUBLICATION supabase_realtime ADD TABLE pedidos_picanteria;
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getPedidosActivos, updateEstadoPedido, cancelarPedido } from "../services/pedidosService";
import {
  webhookPedidoAceptado, webhookPedidoListo,
  webhookPedidoDespachado, webhookPedidoCompletado, webhookPedidoCancelado,
} from "../services/webhookService";

// Flujo real basado en el campo estado_pedido de pedidos_picanteria
const COLUMN_ORDER = ["pendiente", "cocina", "entregar", "completado"];

export const usePedidosRealtime = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cargarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPedidosActivos();
      setPedidos(data);
    } catch (err) {
      console.error("[usePedidosRealtime]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();

    // Supabase Realtime — escucha INSERT/UPDATE en pedidos_picanteria
    const channel = supabase
      .channel("pedidos-picanteria-realtime")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos_picanteria" },
        ({ new: nuevo }) => {
          // Solo mostrar en Kanban si está en estados activos
          if (COLUMN_ORDER.includes(nuevo.estado_pedido)) {
            setPedidos((prev) => [nuevo, ...prev]);
          }
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos_picanteria" },
        ({ new: actualizado }) => {
          setPedidos((prev) => {
            // Si ya no es un estado activo, sacarlo del Kanban
            if (!COLUMN_ORDER.includes(actualizado.estado_pedido)) {
              return prev.filter((p) => p.id !== actualizado.id);
            }
            // Si ya existe, actualizar; si no, agregar
            const existe = prev.find((p) => p.id === actualizado.id);
            return existe
              ? prev.map((p) => (p.id === actualizado.id ? actualizado : p))
              : [...prev, actualizado];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [cargarPedidos]);

  // Avanza al siguiente estado del flujo
  const avanzarEstado = useCallback(async (pedido) => {
    const idx = COLUMN_ORDER.indexOf(pedido.estado_pedido);
    const siguiente = COLUMN_ORDER[idx + 1];
    if (!siguiente) return;

    try {
      await updateEstadoPedido(pedido.id, siguiente);
      // Webhooks salientes (no bloqueantes)
      if (pedido.estado_pedido === "pendiente") webhookPedidoAceptado(pedido).catch(console.warn);
      if (pedido.estado_pedido === "cocina")    webhookPedidoListo(pedido).catch(console.warn);
      if (pedido.estado_pedido === "entregar") {
        const fn = pedido.tipo_servicio === "delivery" ? webhookPedidoDespachado : webhookPedidoCompletado;
        fn(pedido).catch(console.warn);
      }
    } catch (err) {
      console.error("[avanzarEstado]", err);
    }
  }, []);

  const cancelar = useCallback(async (pedido) => {
    try {
      await cancelarPedido(pedido.id);
      webhookPedidoCancelado(pedido).catch(console.warn);
    } catch (err) {
      console.error("[cancelar]", err);
    }
  }, []);

  // Agrupar por columna usando el campo real estado_pedido
  const columns = COLUMN_ORDER.map((estado) => ({
    id: estado,
    cards: pedidos.filter((p) => p.estado_pedido === estado),
  }));

  return { columns, loading, error, avanzarEstado, cancelar, recargar: cargarPedidos };
};

