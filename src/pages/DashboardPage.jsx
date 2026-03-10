import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import { supabase } from "../lib/supabase";

// ── Barra de porcentaje para top platos ───────────────────────────────────────
const BarraPlato = ({ nombre, unidades, maxUnidades, rank }) => {
  const pct = maxUnidades > 0 ? Math.round((unidades / maxUnidades) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{rank}. {nombre}</span>
        <span className="text-gray-400">{unidades} unid.</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

// ── Esqueleto de carga ────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const DashboardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("Hoy");
  const { stats, loading, error, recargar } = useDashboard(selectedPeriod);

  // ── Helpers de formato ────────────────────────────────────────────────────
  const fmt = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`;
  const pct = (n) => `${n ?? 0}%`;

  // ── Distribución de métodos de pago para el donut ─────────────────────────
  const buildDonutPago = (porPago = {}) => {
    const total = Object.values(porPago).reduce((a, b) => a + b, 0);
    if (total === 0) return { gradient: "#E2E8F0 0% 100%", items: [] };

    const colores = {
      Yape:     "#1A6BBA",
      Plin:     "#8B5CF6",
      Efectivo: "#10B981",
      Tarjeta:  "#F59E0B",
    };
    let acum = 0;
    const segmentos = Object.entries(porPago).map(([nombre, cant]) => {
      const desde = acum;
      acum += (cant / total) * 100;
      return { nombre, cant, pct: Math.round((cant / total) * 100), color: colores[nombre] ?? "#94a3b8", desde, hasta: acum };
    });
    const gradient = segmentos.map((s) => `${s.color} ${s.desde.toFixed(1)}% ${s.hasta.toFixed(1)}%`).join(", ");
    return { gradient, items: segmentos };
  };

  const donutPago = buildDonutPago(stats?.porPago);
  const totalServicios = (stats?.delivery ?? 0) + (stats?.recojo ?? 0);
  const pctDelivery = totalServicios > 0 ? Math.round(((stats?.delivery ?? 0) / totalServicios) * 100) : 0;
  const pctRecojo   = 100 - pctDelivery;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Resumen</h1>
            <p className="text-sm text-gray-500 mt-1">Hola de nuevo. Aquí tienes el resumen de hoy.</p>
          </div>
          <div className="hidden sm:flex space-x-2">
            <select
              className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-200 bg-white text-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option>Hoy</option>
              <option>Esta Semana</option>
              <option>Este Mes</option>
            </select>
            <button
              onClick={recargar}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center shadow-sm"
            >
              <span className="material-icons-round text-sm mr-1">refresh</span>
              Actualizar
            </button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2">
            <span className="material-icons-round">error_outline</span>
            Error al cargar datos: {error}
            <button onClick={recargar} className="ml-auto underline text-sm">Reintentar</button>
          </div>
        )}

        {/* ── Stats Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Ingresos Totales",
              icon: "payments",
              value: loading ? null : fmt(stats?.totalIngresos),
              sub: loading ? null : `${stats?.pedidosExitosos ?? 0} pedidos exitosos`,
              trendUp: true,
            },
            {
              title: "Ticket Promedio",
              icon: "receipt_long",
              value: loading ? null : fmt(stats?.ticketPromedio),
              sub: loading ? null : `sobre ${stats?.pedidosExitosos ?? 0} pedidos`,
              trendUp: true,
            },
            {
              title: "Pedidos Exitosos",
              icon: "check_circle",
              value: loading ? null : pct(stats?.tasaExito),
              sub: loading ? null : `${stats?.cancelados ?? 0} cancelados`,
              trendUp: null,
            },
            {
              title: "Total Pedidos",
              icon: "group",
              value: loading ? null : String(stats?.totalPedidos ?? 0),
              sub: loading ? null : `${selectedPeriod.toLowerCase()}`,
              trendUp: null,
            },
          ].map(({ title, icon, value, sub }) => (
            <div key={title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <span className="material-icons-round text-primary text-sm">{icon}</span>
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-28 mt-1" />
              ) : (
                <div className="flex items-baseline flex-col">
                  <span className="text-2xl font-bold text-gray-900">{value}</span>
                  {sub && <span className="text-xs text-gray-400 mt-0.5">{sub}</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top Platos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-lg font-semibold mb-4">Top 5 Platos Más Vendidos</h3>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : stats?.topPlatos?.length > 0 ? (
              <div className="space-y-4">
                {stats.topPlatos.map((p, i) => (
                  <BarraPlato
                    key={p.nombre}
                    nombre={p.nombre}
                    unidades={p.unidades}
                    maxUnidades={stats.topPlatos[0].unidades}
                    rank={i + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                <span className="material-icons-round text-3xl mb-1">bar_chart</span>
                <p className="text-xs text-gray-400">Sin datos en este período</p>
              </div>
            )}
          </div>

          {/* Distribución Métodos de Pago */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold self-start mb-4 w-full">Métodos de Pago</h3>
            {loading ? (
              <Skeleton className="w-32 h-32 rounded-full" />
            ) : donutPago.items.length > 0 ? (
              <>
                <div
                  className="w-32 h-32 rounded-full"
                  style={{
                    background: `conic-gradient(${donutPago.gradient})`,
                    maskImage: "radial-gradient(transparent 55%, black 56%)",
                    WebkitMaskImage: "radial-gradient(transparent 55%, black 56%)",
                  }}
                />
                <div className="mt-4 w-full grid grid-cols-2 gap-2 text-sm">
                  {donutPago.items.map((s) => (
                    <div key={s.nombre} className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: s.color }}></span>
                      {s.nombre} ({s.pct}%)
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                <span className="material-icons-round text-3xl mb-1">donut_large</span>
                <p className="text-xs text-gray-400">Sin datos</p>
              </div>
            )}
          </div>

          {/* Tipo de Servicio */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold self-start mb-4 w-full">Tipo de Servicio</h3>
            {loading ? (
              <div className="w-full space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mt-4 mb-4 w-full">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <span className="text-2xl">🛵</span>
                    </div>
                    <span className="font-medium text-lg">Delivery</span>
                    <span className="text-2xl font-bold mt-1">{pctDelivery}%</span>
                    <span className="text-xs text-gray-400">{stats?.delivery ?? 0} pedidos</span>
                  </div>
                  <div className="w-px h-24 bg-gray-100 mx-4"></div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                      <span className="text-2xl">🏠</span>
                    </div>
                    <span className="font-medium text-lg">Recojo</span>
                    <span className="text-2xl font-bold mt-1">{pctRecojo}%</span>
                    <span className="text-xs text-gray-400">{stats?.recojo ?? 0} pedidos</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden mt-2">
                  <div className="bg-primary h-3 rounded-l-full transition-all" style={{ width: `${pctDelivery}%` }}></div>
                  <div className="bg-secondary h-3 rounded-r-full transition-all" style={{ width: `${pctRecojo}%` }}></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Últimos Pedidos ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Últimos Pedidos</h3>
            <Link to="/historial" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>
          </div>
          <UltimosePedidosTable />
        </div>

      </div>
    </div>
  );
};

// ── Tabla de últimos pedidos desde Supabase ───────────────────────────────────
const UltimosePedidosTable = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("pedidos_picanteria")
      .select("id, cliente_nombre, detalle_pedido, total_final, total_estimado, metodo_pago, tipo_servicio, direccion, estado_pedido, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (!error) setPedidos(data ?? []);
        setLoading(false);
      });
  }, []);

  const formatDetalle = (d) => {
    if (!d) return "Sin detalle";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((i) => `${i.cantidad ?? 1}x ${i.nombre ?? "Item"}`).join(", ");
    return JSON.stringify(d);
  };

  const estadoBadge = (estado) => {
    const map = {
      pendiente:  { bg: "bg-blue-50 text-blue-700",   dot: "bg-blue-500",   label: "Pendiente"  },
      cocina:     { bg: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500", label: "En Cocina"  },
      entregar:   { bg: "bg-orange-50 text-orange-700", dot: "bg-orange-500", label: "Por Entregar" },
      completado: { bg: "bg-green-50 text-green-700",  dot: "bg-green-500",  label: "Completado" },
      cancelado:  { bg: "bg-red-50 text-red-700",      dot: "bg-red-500",    label: "Cancelado"  },
    };
    return map[estado] ?? { bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: estado };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300">
        <span className="material-icons-round text-4xl mb-2">receipt_long</span>
        <p className="text-sm text-gray-400">No hay pedidos registrados aún</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-50">
          <tr>
            {["ID", "Cliente", "Detalle", "Total", "Método Pago", "Servicio", "Dirección", "Estado"].map((h) => (
              <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pedidos.map((row) => {
            const total = row.total_final ?? row.total_estimado;
            const badge = estadoBadge(row.estado_pedido);
            return (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">#{String(row.id).slice(0, 8)}</td>
                <td className="px-6 py-4">{row.cliente_nombre}</td>
                <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">{formatDetalle(row.detalle_pedido)}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">{total ? `S/ ${Number(total).toFixed(2)}` : "—"}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {row.metodo_pago ?? "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    row.tipo_servicio === "delivery" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                  }`}>
                    {row.tipo_servicio === "delivery" ? "Delivery" : "Recojo"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {row.tipo_servicio === "delivery" && row.direccion ? (
                    <span className="flex items-center text-xs text-gray-600 gap-1">
                      <span className="material-icons-round text-blue-400 text-[14px]">location_on</span>
                      <span className="max-w-[160px] truncate" title={row.direccion}>{row.direccion}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} mr-1.5`}></span>
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardPage;

