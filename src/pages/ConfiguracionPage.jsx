import { useState, useRef, useEffect } from "react";
import { usePlatos } from "../hooks/usePlatos";

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const ToggleSwitch = ({ id, checked, onChange }) => (
  <div className="relative inline-block w-10 align-middle select-none">
    <input id={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <label
      htmlFor={id}
      className="block h-5 rounded-full bg-gray-200 cursor-pointer peer-checked:bg-blue-600 transition-colors duration-300"
    />
    <span className="absolute top-0 left-0 w-5 h-5 bg-white rounded-full border-4 border-gray-200 peer-checked:border-blue-600 peer-checked:translate-x-5 transition-all duration-300 pointer-events-none" />
  </div>
);

// ─── Modal de Edición / Nuevo Plato ──────────────────────────────────────────
const EditModal = ({ plato, categorias, categoriaPrefill, onSave, onClose }) => {
  const isNew = !plato;
  const [form, setForm] = useState({
    nombre:       plato?.nombre      ?? "",
    descripcion:  plato?.descripcion ?? "",
    categoria_id: plato?.categoria_id ?? (categoriaPrefill ?? categorias[0]?.id ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await onSave({ ...form, categoria_id: Number(form.categoria_id) });
      onClose();
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isNew ? "Nuevo plato" : "Editar plato"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
            <span className="material-icons-round text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Ceviche Mixto"
              className="block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              placeholder="Ej: Incluye guarnición"
              className="block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.categoria_id}
              onChange={(e) => set("categoria_id", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {err && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <span className="material-icons-round text-[16px]">error_outline</span>
              {err}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-white bg-primary hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-icons-round text-[18px]">{saving ? "hourglass_empty" : (isNew ? "add" : "save")}</span>
              {saving ? "Guardando…" : (isNew ? "Agregar" : "Guardar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Sección de categoría ─────────────────────────────────────────────────────
const CategoriaSection = ({ categoria, platos, onToggle, onEdit, onDelete, onNew }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Icono por categoría
  const icono = (nombre = "") => {
    const n = nombre.toLowerCase();
    if (n.includes("ceviche"))               return { icon: "set_meal",        color: "text-blue-500"   };
    if (n.includes("chicharr"))              return { icon: "lunch_dining",    color: "text-orange-500" };
    if (n.includes("carta"))                 return { icon: "restaurant_menu", color: "text-green-500"  };
    if (n.includes("parihuela") || n.includes("sudado")) return { icon: "soup_kitchen", color: "text-red-500" };
    if (n.includes("dúo") || n.includes("duo")) return { icon: "people",       color: "text-purple-500" };
    if (n.includes("trío") || n.includes("trio")) return { icon: "groups",     color: "text-indigo-500" };
    if (n.includes("bebida"))                return { icon: "local_cafe",      color: "text-teal-500"   };
    return { icon: "restaurant", color: "text-gray-500" };
  };
  const { icon, color } = icono(categoria);

  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          <span className={`material-icons-round ${color}`}>{icon}</span>
          <h2 className="font-bold text-lg text-gray-900">{categoria}</h2>
          <span className="ml-1 bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
            {platos.length}
          </span>
          <span className="material-icons-round text-gray-400 text-sm ml-1">
            {collapsed ? "expand_more" : "expand_less"}
          </span>
        </button>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-500 hover:bg-blue-50 rounded-md transition-colors"
        >
          <span className="material-icons-round text-[18px]">add</span>
          Agregar plato
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Nombre</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Disponible</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {platos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                    <span className="material-icons-round text-3xl block mb-2 opacity-30">restaurant_menu</span>
                    Sin platos. Haz clic en "Agregar plato" para comenzar.
                  </td>
                </tr>
              )}
              {platos.map((plato) => (
                <tr key={plato.id} className={`bg-white hover:bg-slate-50 transition-colors group ${!plato.activo ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{plato.nombre}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[260px] truncate">
                    {plato.descripcion || <span className="italic text-gray-300">Sin descripción</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ToggleSwitch
                      id={`toggle-${plato.id}`}
                      checked={plato.activo}
                      onChange={() => onToggle(plato.id, !plato.activo)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(plato)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar plato"
                      >
                        <span className="material-icons-round text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(plato.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar plato"
                      >
                        <span className="material-icons-round text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const ConfiguracionPage = () => {
  const { porCategoria, categorias, loading, error, agregar, editar, toggleDisp, eliminar, recargar } = usePlatos();
  const [modal, setModal] = useState(null); // { mode: "new"|"edit", plato?, categoriaPrefill? }

  const handleSave = async (form) => {
    if (modal.mode === "new") {
      await agregar({ nombre: form.nombre, descripcion: form.descripcion, categoria_id: form.categoria_id });
    } else {
      await editar(modal.plato.id, { nombre: form.nombre, descripcion: form.descripcion, categoria_id: form.categoria_id });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este plato? Esta acción no se puede deshacer.")) return;
    try {
      await eliminar(id);
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center flex-wrap gap-3">
            Gestión de Menú
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <span className="material-icons-round text-sm">list_alt</span>
            Los cambios se aplican directamente en la base de datos
          </p>
        </div>
        <button
          onClick={recargar}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 rounded-md shadow-sm transition-colors"
        >
          <span className="material-icons-round text-sm">refresh</span>
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
          <span className="material-icons-round">error_outline</span>
          Error al cargar el menú: {error}
          <button onClick={recargar} className="ml-auto underline text-sm">Reintentar</button>
        </div>
      )}

      {/* Carga */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="material-icons-round animate-spin text-3xl mr-2">refresh</span>
          Cargando menú…
        </div>
      )}

      {/* Secciones por categoría */}
      {!loading && (
        <div className="space-y-6 pb-8">
          {Object.entries(porCategoria).map(([categoriaNombre, platos]) => {
            const catObj = categorias.find((c) => c.nombre === categoriaNombre);
            return (
              <CategoriaSection
                key={categoriaNombre}
                categoria={categoriaNombre}
                platos={platos}
                onToggle={toggleDisp}
                onEdit={(plato) => setModal({ mode: "edit", plato })}
                onDelete={handleDelete}
                onNew={() => setModal({ mode: "new", categoriaPrefill: catObj?.id })}
              />
            );
          })}

          {Object.keys(porCategoria).length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <span className="material-icons-round text-5xl mb-3">restaurant_menu</span>
              <p className="text-base font-medium text-gray-400">No hay platos en la base de datos</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <EditModal
          plato={modal.mode === "edit" ? modal.plato : null}
          categorias={categorias}
          categoriaPrefill={modal.categoriaPrefill}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default ConfiguracionPage;




