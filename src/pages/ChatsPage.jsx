// =============================================================================
// TODO: Proxima version — Visualizar chats con clientes
// Esta vista esta lista pero NO sera lanzada en la v1.
// Para activarla:
//   1. Descomentar el bloque de codigo de abajo.
//   2. Descomentar el import en src/App.jsx
//   3. Descomentar la ruta { path: "chats", element: <ChatsPage /> } en App.jsx
//   4. Descomentar el navItem en src/components/Sidebar.jsx
// =============================================================================
/* ── INICIO BLOQUE CHATS ──────────────────────────────────────────────────────
import { useState } from "react";
const CONTACTS = [
  { id: 1, nombre: "Sof\u00eda Mart\u00ednez", tel: "+51 987 654 321", ultimoMsg: "S\u00ed, por favor con rocoto aparte.", hora: "10:45 AM" },
  { id: 2, nombre: "Luis Castillo",             tel: "+51 912 345 678", ultimoMsg: "Quiero pedir 2 Jaleas Familiares.",   hora: "10:30 AM" },
  { id: 3, nombre: "Andrea Torres",             tel: "+51 999 888 777", ultimoMsg: "Gracias, ya lleg\u00f3 mi pedido.",   hora: "Ayer" },
];
const MESSAGES = [
  { id: 1, autor: "bot",     texto: "\u00a1Hola Sof\u00eda! Bienvenida a Picanter\u00eda Lurwis. \u00bfQu\u00e9 te gustar\u00eda pedir hoy?",                                                          hora: "10:40 AM" },
  { id: 2, autor: "cliente", texto: "Hola, quiero un Ceviche Cl\u00e1sico y un Chicharr\u00f3n de Pescado para delivery.",                                                                            hora: "10:42 AM" },
  { id: 3, autor: "bot",     texto: "\u00a1Perfecto! Un Ceviche Cl\u00e1sico y un Chicharr\u00f3n de Pescado. El total es S/ 65.00. \u00bfDeseas alg\u00fan acompa\u00f1amiento o bebida adicional?", hora: "10:42 AM" },
  { id: 4, autor: "cliente", texto: "No, solo eso. Pero el ceviche que pique un poco por favor.",                                                                                                     hora: "10:44 AM" },
  { id: 5, autor: "bot",     texto: "Entendido, ceviche con un poco de picante. \u00bfDeseas el rocoto aparte o mezclado?",                                                                           hora: "10:44 AM" },
  { id: 6, autor: "cliente", texto: "S\u00ed, por favor con rocoto aparte.",                                                                                                                         hora: "10:45 AM" },
];
const ChatsPage = () => {
  const [activeContact, setActiveContact] = useState(CONTACTS[0]);
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <div className="p-4 border-b border-border-light dark:border-border-dark">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">search</span>
            </span>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-border-light dark:border-border-dark rounded-md leading-5 bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              placeholder="Buscar chat..."
              type="text"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll">
          {CONTACTS.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveContact(c)}
              className={`p-4 border-b border-border-light dark:border-border-dark cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${activeContact.id === c.id ? "bg-primary/5" : ""}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-text-main-light dark:text-text-main-dark">{c.nombre}</h3>
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{c.hora}</span>
              </div>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-1">{c.tel}</p>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark line-clamp-1">{c.ultimoMsg}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
        <div className="p-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">{activeContact.nombre}</h2>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{activeContact.tel}</p>
          </div>
          <button className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors flex items-center shadow-sm">
            <span className="material-icons-round text-sm mr-1">front_hand</span>
            Intervenir Bot
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
          {MESSAGES.map((msg) =>
            msg.autor === "bot" ? (
              <div key={msg.id} className="flex items-end">
                <div className="bg-primary text-white rounded-lg rounded-bl-none px-4 py-2 max-w-md shadow-sm">
                  <div className="text-xs text-blue-200 mb-1 font-semibold">Wilson [Bot]</div>
                  <p className="text-sm">{msg.texto}</p>
                  <span className="text-[10px] text-blue-200 block text-right mt-1">{msg.hora}</span>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-end justify-end">
                <div className="bg-gray-200 dark:bg-gray-700 text-text-main-light dark:text-text-main-dark rounded-lg rounded-br-none px-4 py-2 max-w-md shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold text-right">Cliente</div>
                  <p className="text-sm">{msg.texto}</p>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block text-right mt-1">{msg.hora}</span>
                </div>
              </div>
            )
          )}
        </div>
        <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex-shrink-0">
          <div className="flex items-center space-x-2 opacity-50 pointer-events-none">
            <input
              className="flex-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md leading-5 bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:outline-none sm:text-sm"
              placeholder="Interv\u00e9n para escribir un mensaje..."
              type="text"
            />
            <button className="p-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-md">
              <span className="material-icons-round">send</span>
            </button>
          </div>
          <p className="text-xs text-center text-text-muted-light dark:text-text-muted-dark mt-2">
            El bot Wilson est\u00e1 manejando esta conversaci\u00f3n. Haz clic en &ldquo;Intervenir Bot&rdquo; para tomar el control.
          </p>
        </div>
      </div>
    </div>
  );
};
export default ChatsPage;
── FIN BLOQUE CHATS ─────────────────────────────────────────────────────────*/
// Placeholder exportado para que el modulo sea valido mientras esta comentado
const ChatsPage = null;
export default ChatsPage;