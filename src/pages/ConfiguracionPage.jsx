import { useState, useRef, useEffect } from "react";
// ─── Datos iniciales ──────────────────────────────────────────────────────────
const INITIAL_SECTIONS = [
  {
    id: "ceviches",
    icon: "set_meal",
    iconColor: "text-blue-500",
    titulo: "Ceviches y Entradas",
    items: [
      { id: 1, nombre: "Ceviche Clasico",    precio: "35.00", porcion: "unico",    disponible: true },
      { id: 2, nombre: "Leche de Tigre",     precio: "20.00", porcion: "personal", disponible: true },
    ],
  },
  {
    id: "fondos",
    icon: "restaurant_menu",
    iconColor: "text-orange-500",
    titulo: "Platos de Fondo",
    items: [
      { id: 3, nombre: "Arroz con Mariscos", precio: "40.00", porcion: "unico",    disponible: true },
      { id: 4, nombre: "Parihuela",          precio: "45.00", porcion: "familiar", disponible: true },
    ],
  },
  {
    id: "bebidas",
    icon: "local_cafe",
    iconColor: "text-purple-500",
    titulo: "Bebidas y Postres",
    items: [
      { id: 5, nombre: "Chicha Morada (1L)", precio: "15.00", porcion: "unico",    disponible: true },
    ],
  },
];
// ─── Opciones de porcion ──────────────────────────────────────────────────────
const PORCIONES = [
  {
    value: "personal",
    label: "Personal",
    desc:  "1 persona",
    icon:  "person",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    value: "unico",
    label: "Unico",
    desc:  "Estandar",
    icon:  "restaurant",
    badge: "bg-sky-50 text-sky-700",
  },
  {
    value: "familiar",
    label: "Familiar",
    desc:  "2-4 personas",
    icon:  "group",
    badge: "bg-orange-50 text-orange-700",
  },
];
const porcionInfo = (val) => PORCIONES.find((p) => p.value === val) ?? PORCIONES[1];
// ID autoincrementado global
let _nextId = 100;
const nextId = () => ++_nextId;
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
// ─── Modal de Edicion / Nuevo Plato ──────────────────────────────────────────
const EMPTY_ITEM = { nombre: "", precio: "", porcion: "unico" };
const EditModal = ({ item, sectionTitle, onSave, onClose }) => {
  const [form, setForm] = useState(
    item
      ? { nombre: item.nombre, precio: item.precio, porcion: item.porcion }
      : EMPTY_ITEM
  );
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.precio) return;
    onSave({ ...form, precio: parseFloat(form.precio).toFixed(2) });
  };
  const isNew = !item;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl border border-border-light dark:border-border-dark w-full max-w-md">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div>
            <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
              {isNew ? "Nuevo plato" : "Editar plato"}
            </h2>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">{sectionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-icons-round text-xl">close</span>
          </button>
        </div>
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
              Nombre del plato <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Ceviche Mixto"
              className="block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
            />
          </div>
          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
              Precio (S/) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-text-muted-light dark:text-text-muted-dark text-sm font-medium pointer-events-none">
                S/
              </span>
              <input
                type="number"
                required
                min="0"
                step="0.50"
                value={form.precio}
                onChange={(e) => set("precio", e.target.value)}
                placeholder="0.00"
                className="block w-full pl-9 pr-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              />
            </div>
          </div>
          {/* Porcion */}
          <div>
            <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-2">
              Porcion del plato
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PORCIONES.map(({ value, label, desc, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("porcion", value)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg border-2 text-center transition-all ${
                    form.porcion === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="material-icons-round text-[22px]">{icon}</span>
                  <span className="text-sm font-semibold leading-none">{label}</span>
                  <span className="text-[10px] leading-none opacity-70">{desc}</span>
                </button>
              ))}
            </div>
            {/* Preview */}
            <div className="mt-3 p-3 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark flex items-center gap-3">
              <span className="material-icons-round text-primary text-[20px]">
                {porcionInfo(form.porcion).icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-0.5">Vista previa:</p>
                <p className="text-sm font-medium text-text-main-light dark:text-text-main-dark truncate">
                  {form.nombre || "Nombre del plato"}
                  {form.precio ? ` — S/ ${parseFloat(form.precio || 0).toFixed(2)}` : ""}
                </p>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${porcionInfo(form.porcion).badge}`}>
                {porcionInfo(form.porcion).label}
              </span>
            </div>
          </div>
          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border-light dark:border-border-dark rounded-md text-sm font-medium text-text-main-light dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-white bg-primary hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-icons-round text-[18px]">{isNew ? "add" : "save"}</span>
              {isNew ? "Agregar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// ─── Seccion del menu ─────────────────────────────────────────────────────────
const MenuSection = ({ section, onSectionChange }) => {
  const [items, setItems] = useState(section.items);
  const [modal, setModal] = useState(null);
  const commit     = (next) => { setItems(next); onSectionChange(section.id, next); };
  const toggle     = (id)   => commit(items.map((it) => it.id === id ? { ...it, disponible: !it.disponible } : it));
  const remove     = (id)   => commit(items.filter((it) => it.id !== id));
  const openEdit   = (item) => setModal({ mode: "edit", item });
  const openNew    = ()     => setModal({ mode: "new" });
  const closeModal = ()     => setModal(null);
  const handleSave = (form) => {
    if (modal.mode === "edit") {
      commit(items.map((it) => it.id === modal.item.id ? { ...it, ...form } : it));
    } else {
      commit([...items, { id: nextId(), disponible: true, ...form }]);
    }
    closeModal();
  };
  return (
    <>
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <span className={`material-icons-round ${section.iconColor} mr-2`}>{section.icon}</span>
            <h2 className="font-bold text-lg text-gray-900">{section.titulo}</h2>
            <span className="ml-3 bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {items.length} Platos
            </span>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-500 hover:bg-blue-50 rounded-md transition-colors"
          >
            <span className="material-icons-round text-[18px]">add</span>
            Agregar plato
          </button>
        </div>
        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Nombre del Plato</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Precio (S/)</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Porcion</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Disponible</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    <span className="material-icons-round text-3xl block mb-2 opacity-30">restaurant_menu</span>
                    Sin platos. Haz clic en &ldquo;Agregar plato&rdquo; para comenzar.
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const p = porcionInfo(item.porcion);
                return (
                  <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{item.nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">S/ {item.precio}</span>
                    </td>
                    {/* Badge porcion */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${p.badge}`}>
                        <span className="material-icons-round text-[13px]">{p.icon}</span>
                        {p.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleSwitch
                        id={`toggle-${item.id}`}
                        checked={item.disponible}
                        onChange={() => toggle(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar plato"
                        >
                          <span className="material-icons-round text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => remove(item.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar plato"
                        >
                          <span className="material-icons-round text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <EditModal
          item={modal.mode === "edit" ? modal.item : null}
          sectionTitle={section.titulo}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </>
  );
};
// ─── Pagina principal ─────────────────────────────────────────────────────────
const ConfiguracionPage = () => {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const handleSectionChange = (sectionId, newItems) =>
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, items: newItems } : s));
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center flex-wrap gap-3">
            Gestion de Menu (Wilson)
            <span className="inline-flex items-center bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Bot Wilson: Activo</span>
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <span className="material-icons-round text-sm">list_alt</span>
            Editor de Lista Estatica &mdash; los cambios se aplican en tiempo real
          </p>
        </div>
      </div>
      <div className="space-y-8 pb-8">
        {sections.map((section) => (
          <MenuSection key={section.id} section={section} onSectionChange={handleSectionChange} />
        ))}
      </div>
    </div>
  );
};
export default ConfiguracionPage;