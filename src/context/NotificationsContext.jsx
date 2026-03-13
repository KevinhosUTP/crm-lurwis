import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
// ─── Tipos de notificacion ────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  NUEVO_PEDIDO: "nuevo_pedido",
  CANCELADO:    "cancelado",
  COMPLETADO:   "completado",
};
const NUEVO_PEDIDO_SOUND_URL = "/sounds/nuevo-pedido.mp3";
const iconMap = {
  [NOTIF_TYPES.NUEVO_PEDIDO]: { icon: "shopping_bag",  color: "text-blue-600",  bg: "bg-blue-50"   },
  [NOTIF_TYPES.CANCELADO]:    { icon: "cancel",         color: "text-red-500",   bg: "bg-red-50"    },
  [NOTIF_TYPES.COMPLETADO]:   { icon: "check_circle",   color: "text-green-600", bg: "bg-green-50"  },
};
export const notifIcon = (type) => iconMap[type] ?? iconMap[NOTIF_TYPES.NUEVO_PEDIDO];
// ─── Contexto ─────────────────────────────────────────────────────────────────
const NotificationsContext = createContext(null);
let _id = 0;
const uid = () => ++_id;
export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const audioBaseRef = useRef(null);

  useEffect(() => {
    // Coloca tu archivo en: public/sounds/nuevo-pedido.mp3
    const audio = new Audio(NUEVO_PEDIDO_SOUND_URL);
    audio.preload = "auto";
    audio.volume = 1;
    audioBaseRef.current = audio;
  }, []);

  const playNuevoPedidoSound = useCallback(() => {
    try {
      const base = audioBaseRef.current;
      if (!base) return;

      // Clonar evita cortar el sonido si llegan pedidos seguidos.
      const sound = base.cloneNode();
      sound.volume = 1;
      sound.play().catch((err) => {
        console.warn("[Notifications] No se pudo reproducir el audio:", err);
      });
    } catch (err) {
      console.warn("[Notifications] Error reproduciendo audio:", err);
    }
  }, []);

  // Agrega una nueva notificacion
  const push = useCallback((type, title, body) => {
    setNotifications((prev) => [
      {
        id:    uid(),
        type,
        title,
        body,
        time:  "Ahora",
        read:  false,
      },
      ...prev,
    ]);
  }, []);
  // Helpers de acceso rapido
  const pushNuevoPedido = useCallback((id, cliente, total) => {
    push(NOTIF_TYPES.NUEVO_PEDIDO, `Nuevo pedido #${id}`, `${cliente} · S/ ${total}`);
    playNuevoPedidoSound();
  }, [push, playNuevoPedidoSound]);
  const pushCancelado = useCallback((id, cliente, total) =>
    push(NOTIF_TYPES.CANCELADO, `Pedido cancelado`, `${cliente} · S/ ${total}`),
  [push]);
  const pushCompletado = useCallback((id, cliente, total) =>
    push(NOTIF_TYPES.COMPLETADO, `Pedido completado`, `${cliente} · S/ ${total}`),
  [push]);
  // Marca una como leida
  const markRead = useCallback((id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    ), []);
  // Marca todas como leidas
  const markAllRead = useCallback(() =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
  []);
  // Elimina una
  const remove = useCallback((id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id)),
  []);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      push,
      pushNuevoPedido,
      playNuevoPedidoSound,
      pushCancelado,
      pushCompletado,
      markRead,
      markAllRead,
      remove,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
export const useNotifications = () => useContext(NotificationsContext);