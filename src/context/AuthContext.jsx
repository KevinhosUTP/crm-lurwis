import { createContext, useContext, useState, useEffect } from "react";
import {
  signIn,
  signOut,
  getSession,
  onAuthStateChange,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // true mientras verificamos si hay sesión activa al cargar la app
  const [loading, setLoading] = useState(true);

  // ── Al montar: recuperar sesión existente + escuchar cambios ──────────────
  useEffect(() => {
    // 1. Verificar si ya hay sesión (ej: al recargar la página)
    getSession()
      .then((session) => setUser(session?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // 2. Suscribirse a cambios (login / logout / token refresh)
    const {
      data: { subscription },
    } = onAuthStateChange((session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login con Supabase Auth ───────────────────────────────────────────────
  // Lanza excepción si las credenciales son incorrectas —
  // el componente LoginPage hace el try/catch y muestra el error.
  const login = async (email, password) => {
    const supabaseUser = await signIn(email, password);
    setUser(supabaseUser);
    return supabaseUser;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* No renderizar hijos hasta saber si hay sesión — evita flash de /login */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);