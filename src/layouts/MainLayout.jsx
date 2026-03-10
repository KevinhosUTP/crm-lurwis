import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  // Cierra el drawer automaticamente al navegar a otra ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  return (
    <div className="bg-gray-50 text-gray-900 h-screen flex overflow-hidden font-display">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
        {/* Footer global */}
        <footer className="flex-shrink-0 border-t border-gray-100 bg-white px-6 py-2.5 flex items-center justify-center">
          <p className="text-[11px] text-gray-400 text-center">
            Powered by{" "}
            <span className="font-semibold text-gray-500">Kevin Silva</span>
            {" "}— Desarrollador
          </p>
        </footer>
      </div>
    </div>
  );
};
export default MainLayout;