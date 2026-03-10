import { useNotifications } from "../context/NotificationsContext";
import { usePedidosRealtime } from "../hooks/usePedidosRealtime";
import { desglosaDetalle } from "../services/pedidosService";

// ── Config visual por columna ─────────────────────────────────────────────────
const COLUMN_CONFIG = {
  pendiente: {
    label: "Nuevos",
    dotColor: "bg-blue-500",
    headerAccent: "border-t-2 border-t-blue-500",
    acento: "border-l-blue-400",
    btnLabel: "Aceptar → Cocina",
    btnClass: "bg-primary/10 text-primary hover:bg-primary hover:text-white",
  },
  cocina: {
    label: "En Cocina",
    dotColor: "bg-yellow-500",
    headerAccent: "border-t-2 border-t-yellow-500",
    acento: "border-l-yellow-500",
    btnLabel: "Listo → Entregar",
    btnClass: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200",
  },
  entregar: {
    label: "Por Entregar",
    dotColor: "bg-orange-500",
    headerAccent: "border-t-2 border-t-orange-500",
    acento: "border-l-orange-500",
    btnLabel: "Completar",
    btnClass: "bg-green-600 text-white hover:bg-green-700 w-full",
  },
  completado: {
    label: "Completados / En Camino",
    dotColor: "bg-green-500",
    headerAccent: "border-t-2 border-t-green-500",
    faded: true,
  },
};

// ── Chips de items del pedido ─────────────────────────────────────────────────
const DetalleChips = ({ detalle }) => {
  const items = desglosaDetalle(detalle);
  if (items.length === 0) return <span className="text-xs text-gray-400 italic">Sin detalle</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map(({ nombre, cantidad }, idx) => (
        <span key={idx} className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
          {cantidad > 1 ? `${cantidad}× ` : ""}{nombre}
        </span>
      ))}
    </div>
  );
};
const TipoIcon = ({ tipo }) => {
  if (tipo === "delivery")
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 text-blue-600" title="Delivery">
        <span className="material-icons-round text-[16px]">two_wheeler</span>
      </span>
    );
  if (tipo === "recojo")
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-orange-50 text-orange-600" title="Recojo en Tienda">
        <span className="material-icons-round text-[16px]">storefront</span>
      </span>
    );
  return (
    <span className="flex items-center text-xs text-gray-500" title="En Camino">
      <span className="material-icons-round text-[16px] mr-1">local_shipping</span> En Camino
    </span>
  );
};


// ── Tarjeta completada ────────────────────────────────────────────────────────
const CompletedCard = ({ card }) => (
  <div className="bg-white border border-gray-100 border-l-4 border-l-green-500 rounded-lg p-3 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <span className="material-icons-round text-green-500 text-[18px]">check_circle</span>
        <span className="font-bold text-sm text-gray-400">{card.id}</span>
      </div>
    </div>
    <div className="mb-2 pl-1">
      <p className="font-medium text-sm text-gray-400 line-through">{card.cliente_nombre}</p>
      <DetalleChips detalle={card.detalle_pedido} />
      {card.tipo_servicio === "delivery" && card.direccion && (
        <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <span className="material-icons-round text-[13px]">location_on</span>
          <span className="line-clamp-1">{card.direccion}</span>
        </p>
      )}
    </div>
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
      <TipoIcon tipo={card.tipo_servicio} />
    </div>
  </div>
);

// ── Tarjeta activa ────────────────────────────────────────────────────────────
const ActiveCard = ({ card, colId, onAction, onCancel }) => {
  const cfg = COLUMN_CONFIG[colId];
  const total = card.total_final ?? card.total_estimado;

  // Tiempo desde creación
  const minutos = Math.floor((Date.now() - new Date(card.created_at).getTime()) / 60000);
  const tiempoLabel = minutos < 1 ? "< 1 min" : `${minutos} min`;
  const tiempoColor =
    minutos < 10 ? "text-green-700 bg-green-50" :
    minutos < 20 ? "text-orange-700 bg-orange-50" :
    "text-red-700 bg-red-50";

  return (
    <div className={`bg-white border border-gray-100 border-l-4 ${cfg.acento} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group`}>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <span className="material-icons-round text-gray-300 text-[18px] mr-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            drag_indicator
          </span>
          <span className="font-bold text-sm text-gray-900">#{String(card.id).slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-md ${tiempoColor}`}>
            <span className="material-icons-round text-[14px] mr-1">schedule</span>
            {tiempoLabel}
          </div>
          <button
            onClick={() => onCancel(card)}
            className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Cancelar pedido"
          >
            <span className="material-icons-round text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="mb-3 pl-1">
        <p className="font-semibold text-sm text-gray-900">{card.cliente_nombre}</p>
        <DetalleChips detalle={card.detalle_pedido} />
        {total && <p className="text-sm font-bold text-gray-800 mt-1">S/ {Number(total).toFixed(2)}</p>}
        {card.tipo_servicio === "delivery" && card.direccion && (
          <p className="flex items-start gap-1 text-xs text-blue-600 mt-1.5 bg-blue-50 rounded px-2 py-1">
            <span className="material-icons-round text-[13px] mt-0.5 flex-shrink-0">location_on</span>
            <span className="line-clamp-2 leading-snug">{card.direccion}</span>
          </p>
        )}
        {card.telefono && (
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <span className="material-icons-round text-[13px]">phone</span>
            {card.telefono}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <TipoIcon tipo={card.tipo_servicio} />
        <button
          onClick={() => onAction(card)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ml-3 ${cfg.btnClass}`}
        >
          {cfg.btnLabel}
        </button>
      </div>
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────
const PedidosPage = () => {
  const { columns, loading, error, avanzarEstado, cancelar, recargar } = usePedidosRealtime();

  const handleAction = async (card) => {
    await avanzarEstado(card);
  };

  const handleCancel = async (card) => {
    await cancelar(card);
  };

  const activeCount = columns
    .filter((c) => c.id !== "completado")
    .reduce((acc, c) => acc + c.cards.length, 0);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            Pedidos en Vivo
            <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {activeCount} Activos
            </span>
          </h1>
          <p className="flex items-center text-sm text-gray-500 mt-1">
            <span className="material-icons-round text-sm mr-1">bolt</span>
            Actualización en tiempo real — Supabase Realtime
          </p>
        </div>
        <button
          onClick={recargar}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center shadow-sm"
        >
          <span className="material-icons-round text-sm mr-1">refresh</span>
          Recargar
        </button>
      </div>

      {/* Estado de carga / error */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <span className="material-icons-round animate-spin text-3xl mr-2">refresh</span>
          Cargando pedidos…
        </div>
      )}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <span className="material-icons-round">error_outline</span>
          Error al cargar pedidos: {error}
          <button onClick={recargar} className="ml-auto underline text-sm">Reintentar</button>
        </div>
      )}

      {/* Tablero Kanban */}
      {!loading && (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 min-h-0 kanban-scroll">
          {columns.map((col) => {
            const cfg = COLUMN_CONFIG[col.id];
            return (
              <div
                key={col.id}
                className={`flex flex-col flex-shrink-0 w-80 bg-slate-50 rounded-xl border border-gray-200 h-full ${cfg.headerAccent}`}
              >
                {/* Cabecera de columna */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`}></span>
                    <h2 className="font-semibold text-gray-800 text-sm">{cfg.label}</h2>
                  </div>
                  <span className="bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                    {col.cards.length}
                  </span>
                </div>

                {/* Tarjetas */}
                <div className={`flex-1 overflow-y-auto px-3 pb-3 space-y-2.5 kanban-scroll ${cfg.faded ? "opacity-80 hover:opacity-100 transition-opacity" : ""}`}>
                  {col.cards.map((card) =>
                    col.id === "completado" ? (
                      <CompletedCard key={card.id} card={card} />
                    ) : (
                      <ActiveCard
                        key={card.id}
                        card={card}
                        colId={col.id}
                        onAction={handleAction}
                        onCancel={handleCancel}
                      />
                    )
                  )}
                  {col.cards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                      <span className="material-icons-round text-3xl mb-1">inbox</span>
                      <p className="text-xs">Sin pedidos</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PedidosPage;

