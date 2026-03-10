// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePedidosRealtime.js
// Kanban en vivo — Supabase Realtime sobre pedidos_picanteria
// ─────────────────────────────────────────────────────────────────────────────
//
// ACTIVAR REALTIME EN SUPABASE:
//   SQL Editor → ejecutar:
//   ALTER PUBLICATION supabase_realtime ADD TABLE pedidos_picanteria;
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getPedidosActivos, updateEstadoPedido, cancelarPedido } from "../services/pedidosService";
import {
  webhookPedidoAceptado, webhookPedidoListo,
  webhookPedidoDespachado, webhookPedidoCompletado, webhookPedidoCancelado,
  webhookFinalizarPedido,
} from "../services/webhookService";
import { useNotifications } from "../context/NotificationsContext";

// Flujo real basado en el campo estado_pedido de pedidos_picanteria
const COLUMN_ORDER = ["pendiente", "cocina", "entregar", "completado"];
const MAX_COMPLETADOS = 3;

export const usePedidosRealtime = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const { pushNuevoPedido, pushCancelado, pushCompletado } = useNotifications();
  // Ref para evitar notificaciones en la carga inicial
  const inicializado = useRef(false);

  const cargarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPedidosActivos();
      setPedidos(data);
      inicializado.current = true;
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
            // Notificar solo después de la carga inicial
            if (inicializado.current) {
              const total = nuevo.total_final ?? nuevo.total_estimado ?? "?";
              pushNuevoPedido(String(nuevo.id).slice(0, 8), nuevo.cliente_nombre ?? "Cliente", total);
            }
          }
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos_picanteria" },
        ({ new: actualizado }) => {
          // Solo actualizar si el pedido ya está en nuestro estado local
          setPedidos((prev) => {
            const existe = prev.find((p) => p.id === actualizado.id);
            if (!existe) return prev;
            return prev.map((p) => (p.id === actualizado.id ? actualizado : p));
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  // pushNuevoPedido se omite intencionalmente de las deps para evitar
  // que una re-creación de la función destruya y recree el canal Realtime.
  // Es un useCallback estable; si cambia, la siguiente suscripción lo usará.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargarPedidos]);

  // Avanza al siguiente estado del flujo
  const avanzarEstado = useCallback(async (pedido) => {
    const idx = COLUMN_ORDER.indexOf(pedido.estado_pedido);
    const siguiente = COLUMN_ORDER[idx + 1];
    if (!siguiente) return;

    try {
      const actualizado = await updateEstadoPedido(pedido.id, siguiente);
      // Actualizar estado local inmediatamente (no depender solo de Realtime)
      setPedidos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p))
      );
      // Webhooks salientes (no bloqueantes)
      if (pedido.estado_pedido === "pendiente") webhookPedidoAceptado(pedido).catch(console.warn);
      if (pedido.estado_pedido === "cocina")    webhookPedidoListo(pedido).catch(console.warn);
      if (pedido.estado_pedido === "entregar") {
        const fn = pedido.tipo_servicio === "delivery" ? webhookPedidoDespachado : webhookPedidoCompletado;
        fn(pedido).catch(console.warn);
        // Notificación de completado
        const total = pedido.total_final ?? pedido.total_estimado ?? "?";
        pushCompletado(String(pedido.id).slice(0, 8), pedido.cliente_nombre ?? "Cliente", total);
        // ── Workflow N8N: mensaje WhatsApp "provecho" + borrar memoria ──────
        webhookFinalizarPedido(pedido).catch(console.warn);
      }
    } catch (err) {
      console.error("[avanzarEstado]", err);
    }
  }, [pushCompletado]);

  const cancelar = useCallback(async (pedido) => {
    try {
      const actualizado = await cancelarPedido(pedido.id);
      // Actualizar estado local inmediatamente
      setPedidos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p))
      );
      webhookPedidoCancelado(pedido).catch(console.warn);
      const total = pedido.total_final ?? pedido.total_estimado ?? "?";
      pushCancelado(String(pedido.id).slice(0, 8), pedido.cliente_nombre ?? "Cliente", total);
    } catch (err) {
      console.error("[cancelar]", err);
    }
  }, [pushCancelado]);

  // Agrupar por columna; completados máximo MAX_COMPLETADOS
  const columns = COLUMN_ORDER.map((estado) => {
    let cards = pedidos.filter((p) => p.estado_pedido === estado);
    if (estado === "completado") {
      // Mostrar solo los últimos MAX_COMPLETADOS (más recientes primero)
      cards = cards
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, MAX_COMPLETADOS);
    }
    return { id: estado, cards };
  });

  return { columns, loading, error, avanzarEstado, cancelar, recargar: cargarPedidos };
};

