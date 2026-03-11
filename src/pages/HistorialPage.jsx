import { useState } from "react";
import { usePedidosHistorial } from "../hooks/usePedidosHistorial";
import { desglosaDetalle } from "../utils/pedidosUtils";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE COLUMNAS KANBAN
// ─────────────────────────────────────────────────────────────────────────────
const COLUMN_DEFS = [
  { id: "completado", label: "Entregados",  dotColor: "bg-green-500",  headerAccent: "border-t-2 border-t-green-500",  acento: "border-l-green-500" },
  { id: "recogido",   label: "Recogidos",   dotColor: "bg-teal-500",   headerAccent: "border-t-2 border-t-teal-500",   acento: "border-l-teal-500"  },
  { id: "cancelado",  label: "Cancelados",  dotColor: "bg-red-500",    headerAccent: "border-t-2 border-t-red-500",    acento: "border-l-red-500"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// MÉTODOS DE PAGO disponibles para filtrar
// ─────────────────────────────────────────────────────────────────────────────
const METODOS_PAGO = [
  { key: "Yape",     icon: "smartphone",  color: "text-purple-600", activeBg: "bg-purple-100 border-purple-400 text-purple-700" },
  { key: "Plin",     icon: "smartphone",  color: "text-blue-400",   activeBg: "bg-blue-100 border-blue-400 text-blue-700"     },
  { key: "Efectivo", icon: "payments",    color: "text-green-600",  activeBg: "bg-green-100 border-green-400 text-green-700"  },
  { key: "Tarjeta",  icon: "credit_card", color: "text-blue-600",   activeBg: "bg-sky-100 border-sky-400 text-sky-700"        },
];

// ── Chips legibles de items del pedido ───────────────────────────────────────
const DetalleItems = ({ detalle, cancelado = false }) => {
  const items = desglosaDetalle(detalle);
  if (items.length === 0)
    return <span className="text-xs text-gray-400 italic">Sin detalle</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map(({ nombre, cantidad }, idx) => (
        <span
          key={idx}
          className={`inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded ${
            cancelado ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-700"
          }`}
        >
          {cantidad > 1 ? `${cantidad}× ` : ""}{nombre}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const HistorialPage = () => {
  const [periodo, setPeriodo]           = useState("Todo");
  const [pagosActivos, setPagosActivos] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { porEstado, totalIngresos, pedidos, loading, error, recargar } =
    usePedidosHistorial(periodo, pagosActivos);

  const togglePago = (key) =>
    setPagosActivos((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );

  // Construir columnas desde porEstado del hook
  const columns = COLUMN_DEFS.map((col) => ({
    ...col,
    cards: porEstado[col.id] ?? [],
  }));

  const totalPedidos     = pedidos.length;
  const hayFiltrosActivos = pagosActivos.length > 0;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Ciclo de vida de los pedidos completados</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de período */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option>Todo</option>
              <option>Hoy</option>
              <option>Esta Semana</option>
              <option>Este Mes</option>
              <option>Mes Pasado</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <span className="material-icons-round text-sm">expand_more</span>
            </div>
          </div>

          {/* Botón Filtros con badge */}
          <button
            onClick={() => setMostrarFiltros((v) => !v)}
            className={`relative flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium border shadow-sm transition-colors ${
              mostrarFiltros || hayFiltrosActivos
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="material-icons-round text-sm">tune</span>
            Filtros
            {hayFiltrosActivos && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pagosActivos.length}
              </span>
            )}
          </button>

          {hayFiltrosActivos && (
            <button
              onClick={() => setPagosActivos([])}
              className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors shadow-sm"
            >
              <span className="material-icons-round text-sm">close</span>
              Limpiar
            </button>
          )}

          <button
            onClick={recargar}
            className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-icons-round text-sm">refresh</span>
          </button>
        </div>
      </div>

      {/* ── Panel de filtros de método de pago ────────────────────────────── */}
      {mostrarFiltros && (
        <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Método de pago</p>
          <div className="flex flex-wrap gap-2">
            {METODOS_PAGO.map((m) => {
              const activo = pagosActivos.includes(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => togglePago(m.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activo ? m.activeBg : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className={`material-icons-round text-[15px] ${activo ? "" : m.color}`}>{m.icon}</span>
                  {m.key}
                  {activo && <span className="material-icons-round text-[13px]">check</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <span className="material-icons-round">error_outline</span>
          Error al cargar historial: {error}
          <button onClick={recargar} className="ml-auto underline text-sm">Reintentar</button>
        </div>
      )}

      {/* ── Estadísticas rápidas ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total pedidos",  value: loading ? "…" : totalPedidos,                          icon: "receipt_long", color: "text-blue-600",  bg: "bg-blue-50"  },
          { label: "Ingresos netos", value: loading ? "…" : `S/ ${totalIngresos.toFixed(2)}`,       icon: "payments",     color: "text-green-600", bg: "bg-green-50" },
          { label: "Entregados",     value: loading ? "…" : ((columns[0]?.cards.length ?? 0) + (columns[1]?.cards.length ?? 0)), icon: "two_wheeler",  color: "text-teal-600",  bg: "bg-teal-50"  },
          { label: "Cancelados",     value: loading ? "…" : (columns[2]?.cards.length ?? 0),        icon: "cancel",       color: "text-red-500",   bg: "bg-red-50"   },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-icons-round text-[18px] ${color}`}>{icon}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-base font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Estado de carga ───────────────────────────────────────────────── */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <span className="material-icons-round animate-spin text-3xl mr-2">refresh</span>
          Cargando historial…
        </div>
      )}

      {/* ── Estado vacío global ───────────────────────────────────────────── */}
      {!loading && pedidos.length === 0 && (
        <div className="flex-shrink-0 flex flex-col items-center justify-center py-16 text-gray-300">
          <span className="material-icons-round text-5xl mb-3">search_off</span>
          <p className="text-base font-medium text-gray-400">Sin resultados</p>
          <p className="text-sm text-gray-400 mt-1">Prueba cambiando el período o los filtros de pago</p>
        </div>
      )}

      {/* ── Tablero Kanban ────────────────────────────────────────────────── */}
      {!loading && pedidos.length > 0 && (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 min-h-0 kanban-scroll">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`flex flex-col flex-1 min-w-[280px] bg-slate-50 rounded-xl border border-gray-200 h-full ${col.headerAccent}`}
            >
              {/* Cabecera columna */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`}></span>
                  <h2 className="font-semibold text-gray-800 text-sm">{col.label}</h2>
                </div>
                <span className="bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                  {col.cards.length}
                </span>
              </div>

              {/* Tarjetas */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5 kanban-scroll">
                {col.cards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                    <span className="material-icons-round text-3xl mb-1">inbox</span>
                    <p className="text-xs">Sin pedidos</p>
                  </div>
                )}

                {col.cards.map((card) => {
                  const total = card.total_final ?? card.total_estimado;
                  return (
                    <div
                      key={card.id}
                      className={`bg-white border border-gray-100 border-l-4 ${col.acento} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                        card.estado_pedido === "cancelado" ? "opacity-70" : ""
                      }`}
                    >
                      {/* ID + fecha */}
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-bold text-sm text-gray-900">#{String(card.id).slice(0, 8)}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(card.created_at).toLocaleString("es-PE", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Datos */}
                      <div className="mb-3 pl-1">
                        <p className="font-semibold text-sm text-gray-900">{card.cliente_nombre}</p>
                        <DetalleItems detalle={card.detalle_pedido} cancelado={card.estado_pedido === "cancelado"} />
                        {total && <p className="text-sm font-bold text-gray-800 mt-1.5">S/ {Number(total).toFixed(2)}</p>}

                        {(card.tipo_servicio ?? "").toLowerCase() === "delivery" && card.direccion && card.direccion !== "Sin dirección" && (
                          <p className={`flex items-center gap-1 text-xs mt-1.5 rounded px-2 py-1 ${
                            card.estado_pedido === "cancelado" ? "bg-red-50 text-red-400" : "bg-blue-50 text-blue-600"
                          }`}>
                            <span className="material-icons-round text-[13px] flex-shrink-0">location_on</span>
                            <span className="line-clamp-2 leading-snug">{card.direccion}</span>
                          </p>
                        )}
                      </div>

                      {/* Footer: tipo + pago */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        {(card.tipo_servicio ?? "").toLowerCase() === "delivery" ? (
                          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 text-blue-600" title="Delivery">
                            <span className="material-icons-round text-[16px]">two_wheeler</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-orange-50 text-orange-600" title="Recojo">
                            <span className="material-icons-round text-[16px]">storefront</span>
                          </span>
                        )}

                        {card.metodo_pago && (
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            card.metodo_pago === "Yape"     ? "bg-purple-50 text-purple-700" :
                            card.metodo_pago === "Plin"     ? "bg-blue-50 text-blue-700"     :
                            card.metodo_pago === "Efectivo" ? "bg-green-50 text-green-700"   :
                            card.metodo_pago === "Tarjeta"  ? "bg-sky-50 text-sky-700"       :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            <span className="material-icons-round text-[14px]">
                              {card.metodo_pago === "Tarjeta" ? "credit_card" : "smartphone"}
                            </span>
                            {card.metodo_pago}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorialPage;

