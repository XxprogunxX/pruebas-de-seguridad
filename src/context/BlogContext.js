import React, { createContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { supabase } from '../config/supabase';

export const BlogContext = createContext();

export const BlogProvider = ({ children }) => {
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const bucket = process.env.REACT_APP_SUPABASE_BUCKET || 'imagenes';

  const uploadImagen = async (file) => {
    if (!file) return null;
    const nombreLimpio = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { data, error: errUpload } = await supabase.storage
      .from(bucket)
      .upload(nombreLimpio, file, { upsert: true });
    if (errUpload) throw errUpload;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  useEffect(() => {
    const cargarArticulos = async () => {
      setCargando(true);
      setError(null);
      try {
        // Intentar cargar con ordenamiento, si falla, cargar sin él
        let snapshot;
        try {
          const q = query(collection(db, 'articulos'), orderBy('createdAt', 'desc'));
          snapshot = await getDocs(q);
        } catch (ordenErr) {
          console.warn('Ordenamiento no disponible, cargando sin orden:', ordenErr);
          snapshot = await getDocs(collection(db, 'articulos'));
        }
        
        const lista = snapshot.docs.map((d) => {
          const data = d.data();
          const fecha = data.fecha || (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString());
          return { id: d.id, ...data, fecha };
        });
        setArticulos(lista);
      } catch (err) {
        console.error('Error cargando artículos', err);
        setError('No se pudieron cargar los artículos');
        setArticulos([]);
      } finally {
        setCargando(false);
      }
    };

    cargarArticulos();
  }, []);

  const agregarArticulo = async (articulo) => {
    setError(null);
    let fotoUrl = articulo.foto || null;
    if (articulo.archivo) {
      fotoUrl = await uploadImagen(articulo.archivo);
    }
    const payload = {
      nombre: articulo.nombre,
      precio: articulo.precio,
      foto: fotoUrl,
      createdAt: serverTimestamp(),
      fecha: new Date().toLocaleDateString()
    };
    const ref = await addDoc(collection(db, 'articulos'), payload);
    setArticulos((prev) => [{ id: ref.id, ...payload }, ...prev]);
    return { id: ref.id, ...payload };
  };

  const modificarArticulo = async (id, datosActualizados) => {
    setError(null);
    let fotoUrl = datosActualizados.foto;
    if (datosActualizados.archivo) {
      fotoUrl = await uploadImagen(datosActualizados.archivo);
    }
    const payload = { ...datosActualizados, foto: fotoUrl };
    delete payload.archivo;

    const ref = doc(db, 'articulos', id);
    await updateDoc(ref, payload);
    setArticulos((prev) =>
      prev.map((art) => (art.id === id ? { ...art, ...payload } : art))
    );
  };

  const eliminarArticulo = async (id) => {
    setError(null);
    const ref = doc(db, 'articulos', id);
    await deleteDoc(ref);
    setArticulos((prev) => prev.filter((art) => art.id !== id));
  };

  const value = {
    articulos,
    agregarArticulo,
    modificarArticulo,
    eliminarArticulo,
    cargando,
    error,
    setError
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};
