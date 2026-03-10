import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import ProtectedRoute from "./layouts/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PedidosPage from "./pages/PedidosPage";
import HistorialPage from "./pages/HistorialPage";
// TODO: Proxima version — Visualizar chats con clientes
// import ChatsPage from "./pages/ChatsPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
const router = createBrowserRouter([
  // Ruta publica
  { path: "/login", element: <LoginPage /> },
  // Rutas protegidas — si no hay sesion, redirige a /login
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true,       element: <DashboardPage /> },
          { path: "pedidos",   element: <PedidosPage /> },
          { path: "historial", element: <HistorialPage /> },
          // TODO: Proxima version — Visualizar chats con clientes
          // { path: "chats",  element: <ChatsPage /> },
          { path: "config",    element: <ConfiguracionPage /> },
        ],
      },
    ],
  },
  // Cualquier ruta desconocida va al dashboard (o login si no hay sesion)
  { path: "*", element: <Navigate to="/" replace /> },
]);
const App = () => (
  <AuthProvider>
    <NotificationsProvider>
      <RouterProvider router={router} />
    </NotificationsProvider>
  </AuthProvider>
);
export default App;