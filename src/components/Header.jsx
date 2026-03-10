import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications, notifIcon } from "../context/NotificationsContext";
import { LOGO_URL, BRAND_NAME } from "../config/brand";
// ─── Panel de notificaciones ──────────────────────────────────────────────────
const NotificationsPanel = ({ onClose }) => {
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const panelRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);
  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Marcar todas como leidas
          </button>
        )}
      </div>
      {/* Lista */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <span className="material-icons-round text-4xl mb-2">notifications_none</span>
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          notifications.map((n) => {
            const { icon, color, bg } = notifIcon(n.type);
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                  n.read ? "bg-white hover:bg-gray-50" : "bg-blue-50/40 hover:bg-blue-50"
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bg} flex items-center justify-center mt-0.5`}>
                  <span className={`material-icons-round text-[16px] ${color}`}>{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={`text-sm font-semibold leading-snug ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                  className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors mt-0.5"
                  title="Eliminar"
                >
                  <span className="material-icons-round text-[14px]">close</span>
                </button>
              </div>
            );
          })
        )}
      </div>
      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            {unreadCount === 0
              ? "Todas las notificaciones leidas"
              : `${unreadCount} sin leer — haz clic para marcar como leida`}
          </p>
        </div>
      )}
    </div>
  );
};
// ─── Header principal ─────────────────────────────────────────────────────────
const Header = ({ onMenuClick }) => {
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      {/* Lado izquierdo: hamburguesa (movil) + buscador (desktop) */}
      <div className="flex items-center gap-3 flex-1">
        {/* Boton hamburguesa — solo visible en movil */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Abrir menu"
        >
          <span className="material-icons-round text-[22px]">menu</span>
        </button>
        {/* Buscador — oculto en movil, visible en sm+ */}
        <div className="relative w-48 sm:w-64 md:w-96 hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-icons-round text-gray-400 text-xl">search</span>
          </span>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white sm:text-sm transition-colors"
            placeholder="Buscar pedido, cliente..."
            type="text"
          />
        </div>
      </div>
      {/* Lado derecho: notificaciones + avatar + salir */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className={`relative p-2 rounded-md transition-colors ${
              showNotifs ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title="Notificaciones"
          >
            <span className="material-icons-round text-[22px]">
              {unreadCount > 0 ? "notifications_active" : "notifications"}
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 ring-2 ring-white leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
        </div>
        {/* Divider */}
        <div className="w-px h-6 bg-gray-100 mx-1"></div>
        {/* Avatar + nombre */}
        <div className="flex items-center gap-2">
          <img
            alt={BRAND_NAME}
            className="h-8 w-8 rounded-full object-cover border-2 border-gray-100 shadow-sm flex-shrink-0"
            src={LOGO_URL}
          />
          <span className="text-sm font-semibold text-gray-800 hidden sm:block">
            {user?.name ?? "Admin"}
          </span>
        </div>
        {/* Cerrar sesion */}
        <button
          onClick={handleLogout}
          title="Cerrar sesion"
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <span className="material-icons-round text-[18px]">logout</span>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};
export default Header;