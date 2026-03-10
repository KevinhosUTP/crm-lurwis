﻿import { useState } from "react";
import { LOGO_URL, BRAND_NAME } from "../config/brand";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Si ya esta autenticado, redirige al dashboard
  if (user) return <Navigate to="/" replace />;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      // Supabase devuelve mensajes en inglés — los traducimos
      const msg = err?.message ?? "";
      if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Debes confirmar tu correo electrónico antes de ingresar.");
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark min-h-screen flex items-center justify-center font-display p-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            alt={BRAND_NAME}
            className="h-32 w-32 rounded-full object-cover shadow-sm border-4 border-white dark:border-surface-dark"
            src={LOGO_URL}
          />
        </div>
        {/* Titulo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
            Bienvenido, Admin
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
            Ingresa tus credenciales para acceder al panel
          </p>
        </div>
        {/* Error banner */}
        {error && (
          <div className="w-full mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-md">
            <span className="material-icons-round text-[18px] flex-shrink-0">error_outline</span>
            <span>{error}</span>
          </div>
        )}
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Usuario */}
          <div>
            <label
              className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1"
              htmlFor="username"
            >
              Usuario o Correo Electronico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                  person
                </span>
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="admin@lurwis.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-border-light dark:border-border-dark rounded-md leading-5 bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              />
            </div>
          </div>
          {/* Contrasena */}
          <div>
            <label
              className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1"
              htmlFor="password"
            >
              Contrasena
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons-round text-text-muted-light dark:text-text-muted-dark text-xl">
                  lock
                </span>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-border-light dark:border-border-dark rounded-md leading-5 bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted-light dark:text-text-muted-dark hover:text-primary focus:outline-none transition-colors"
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
              >
                <span className="material-icons-round text-xl">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>
          </div>
          {/* Recordarme / Olvido */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-border-light dark:border-border-dark rounded bg-background-light dark:bg-background-dark cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-text-muted-light dark:text-text-muted-dark cursor-pointer"
              >
                Recordarme
              </label>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Olvidaste tu contrasena?
            </a>
          </div>
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verificando...
              </>
            ) : (
              "Iniciar Sesion"
            )}
          </button>
        </form>
        {/* Footer */}
        <div className="mt-8">
          <p className="text-xs text-gray-400 text-center">
            Powered by Kevin Silva — Desarrollador
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;