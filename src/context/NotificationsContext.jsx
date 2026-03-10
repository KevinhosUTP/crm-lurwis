import { createContext, useContext, useState, useCallback } from "react";
// ─── Tipos de notificacion ────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  NUEVO_PEDIDO: "nuevo_pedido",
  CANCELADO:    "cancelado",
  INFO:         "info",
};
const iconMap = {
  [NOTIF_TYPES.NUEVO_PEDIDO]: { icon: "shopping_bag",  color: "text-blue-600",  bg: "bg-blue-50"  },
  [NOTIF_TYPES.CANCELADO]:    { icon: "cancel",         color: "text-red-500",   bg: "bg-red-50"   },
  [NOTIF_TYPES.INFO]:         { icon: "info",           color: "text-gray-500",  bg: "bg-gray-50"  },
};
export const notifIcon = (type) => iconMap[type] ?? iconMap[NOTIF_TYPES.INFO];
// ─── Contexto ─────────────────────────────────────────────────────────────────
const NotificationsContext = createContext(null);
let _id = 0;
const uid = () => ++_id;
export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    // Notificaciones de ejemplo al arrancar
    {
      id: uid(),
      type: NOTIF_TYPES.NUEVO_PEDIDO,
      title: "Nuevo pedido #1045",
      body:  "Sofia Martinez — Ceviche + Chicharron · S/ 65.00",
      time:  "Hace 1 min",
      read:  false,
    },
    {
      id: uid(),
      type: NOTIF_TYPES.CANCELADO,
      title: "Pedido #1032 cancelado",
      body:  "Carlos Mendoza cancelo su pedido de S/ 55.00",
      time:  "Hace 12 min",
      read:  false,
    },
  ]);
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
  const pushNuevoPedido = useCallback((id, cliente, total) =>
    push(NOTIF_TYPES.NUEVO_PEDIDO, `Nuevo pedido ${id}`, `${cliente} · S/ ${total}`),
  [push]);
  const pushCancelado = useCallback((id, cliente, total) =>
    push(NOTIF_TYPES.CANCELADO, `Pedido ${id} cancelado`, `${cliente} cancelo su pedido de S/ ${total}`),
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
      pushCancelado,
      markRead,
      markAllRead,
      remove,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
export const useNotifications = () => useContext(NotificationsContext);