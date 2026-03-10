// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePlatos.js
// CRUD del catálogo — tablas platos + plato_precios + categorias
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  getCategorias,
  getPlatosConPrecios,
  crearPlato,
  crearPreciosPlato,
  updatePlato,
  updatePrecio,
  deletePlato,
  toggleDisponibilidadPlato,
} from "../services/platosService";

export const usePlatos = () => {
  const [platos,     setPlatos]     = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [platosData, catData] = await Promise.all([
        getPlatosConPrecios(),
        getCategorias(),
      ]);
      setPlatos(platosData);
      setCategorias(catData);
    } catch (err) {
      console.error("[usePlatos]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Crear plato + sus precios en una sola operación
  const agregar = useCallback(async ({ nombre, descripcion, categoria_id, precios }) => {
    const nuevoPlato = await crearPlato({ nombre, descripcion, categoria_id });
    if (precios?.length) {
      await crearPreciosPlato(nuevoPlato.id, precios);
    }
    await cargar(); // recargar para tener el join completo
  }, [cargar]);

  // Editar nombre/descripción del plato
  const editar = useCallback(async (id, cambios) => {
    const actualizado = await updatePlato(id, cambios);
    setPlatos((prev) => prev.map((p) => (p.id === id ? { ...p, ...actualizado } : p)));
  }, []);

  // Editar un precio específico
  const editarPrecio = useCallback(async (precioId, cambios) => {
    const actualizado = await updatePrecio(precioId, cambios);
    setPlatos((prev) =>
      prev.map((p) => ({
        ...p,
        precios: p.precios.map((pr) => (pr.id === precioId ? actualizado : pr)),
      }))
    );
  }, []);

  // Toggle activo/inactivo
  const toggleDisp = useCallback(async (id, activo) => {
    await toggleDisponibilidadPlato(id, activo);
    setPlatos((prev) => prev.map((p) => (p.id === id ? { ...p, activo } : p)));
  }, []);

  // Eliminar plato
  const eliminar = useCallback(async (id) => {
    await deletePlato(id);
    setPlatos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Agrupar por categoria_nombre respetando el orden de categorías por id
  const porCategoria = categorias.reduce((acc, cat) => {
    acc[cat.nombre] = platos.filter((p) => p.categoria_id === cat.id);
    return acc;
  }, {});

  return {
    platos, porCategoria, categorias,
    loading, error,
    agregar, editar, editarPrecio, toggleDisp, eliminar,
    recargar: cargar,
  };
};

