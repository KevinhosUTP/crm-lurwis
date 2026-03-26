import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNotifications } from "../context/NotificationsContext";

const ESTADOS_NOTIFICABLES = new Set(["pendiente", "cocina", "entregar", "completado"]);

export const usePedidosNotificationsRealtime = () => {
  const { pushNuevoPedido } = useNotifications();

  useEffect(() => {
    const channel = supabase
      .channel("pedidos-picanteria-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos_picanteria" },
        ({ new: nuevo }) => {
          if (!ESTADOS_NOTIFICABLES.has(nuevo.estado_pedido)) return;

          const total = nuevo.total_final ?? nuevo.total_estimado ?? "?";
          pushNuevoPedido(String(nuevo.id).slice(0, 8), nuevo.cliente_nombre ?? "Cliente", total);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pushNuevoPedido]);
};

