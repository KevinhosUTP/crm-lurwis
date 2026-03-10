import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
const navItems = [
  { to: "/",          icon: "dashboard",   label: "Dashboard",           end: true  },
  { to: "/pedidos",   icon: "view_kanban", label: "Pedidos en Vivo",     end: false },
  { to: "/historial", icon: "history",     label: "Historial de Ventas", end: false },
  // TODO: Proxima version — Visualizar chats con clientes
  // { to: "/chats",  icon: "chat",        label: "Visualizar chats con clientes", end: false },
  { to: "/config",    icon: "settings",    label: "Configuracion",       end: false },
];
const baseClass    = "flex items-center px-3 py-2.5 rounded-md font-medium transition-colors w-full text-left";
const activeClass  = "bg-blue-50 text-blue-600";
const inactiveClass = "text-gray-500 hover:bg-gray-100 hover:text-gray-800";
const NavContent = ({ onClose }) => (
  <>
    {/* Logo */}
    <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center">
        <span className="material-icons-round text-blue-600 mr-2 text-2xl">restaurant</span>
        <span className="font-bold text-lg tracking-tight text-gray-900">Lurwis Admin</span>
      </div>
      {/* Boton cerrar — solo en movil */}
      {onClose && (
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <span className="material-icons-round text-xl">close</span>
        </button>
      )}
    </div>
    {/* Navegacion */}
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
      {navItems.map(({ to, icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onClose}
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span className="material-icons-round mr-3 text-xl">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
    {/* Footer del sidebar */}
    <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
      <p className="text-[11px] text-gray-400 text-center">Powered by <span className="font-medium text-gray-500">Kevin Silva</span> — Desarrollador</p>
    </div>
  </>
);
const Sidebar = ({ open, onClose }) => {
  // Bloquea el scroll del body cuando el drawer esta abierto en movil
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      {/* ── Desktop: sidebar fijo ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-full flex-shrink-0">
        <NavContent onClose={null} />
      </aside>
      {/* ── Movil: overlay + drawer deslizante ───────────────────────── */}
      {/* Overlay oscuro */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-gray-100 shadow-2xl
          transform transition-transform duration-300 ease-in-out md:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <NavContent onClose={onClose} />
      </aside>
    </>
  );
};
export default Sidebar;