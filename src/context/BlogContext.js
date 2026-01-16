import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { supabase } from '../config/supabase';
import { AuthContext } from './AuthContext';

export const BlogContext = createContext();

export const BlogProvider = ({ children }) => {
  const { usuario } = useContext(AuthContext);
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const bucket = process.env.REACT_APP_SUPABASE_BUCKET || 'imagenes';

  // Función para sanitizar inputs y prevenir XSS
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  };

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
        let snapshot;
        
        // Si hay usuario logueado y es usuario normal, carga solo sus artículos
        // Si es admin, carga todos
        // Si NO hay usuario logueado, carga todos los artículos para que los vea
        const esAdmin = usuario?.rol === 'admin';
        const tieneUsuario = !!usuario;

        if (tieneUsuario && !esAdmin) {
          // Usuario logueado normal: solo sus artículos
          try {
            const q = query(
              collection(db, 'articulos'),
              where('userId', '==', usuario.uid),
              orderBy('createdAt', 'desc')
            );
            snapshot = await getDocs(q);
          } catch (ordenErr) {
            console.warn('Ordenamiento no disponible, cargando sin orden:', ordenErr);
            const q = query(
              collection(db, 'articulos'),
              where('userId', '==', usuario.uid)
            );
            snapshot = await getDocs(q);
          }
        } else {
          // Sin usuario o es admin: carga todos los artículos
          try {
            const q = query(collection(db, 'articulos'), orderBy('createdAt', 'desc'));
            snapshot = await getDocs(q);
          } catch (ordenErr) {
            console.warn('Ordenamiento no disponible, cargando sin orden:', ordenErr);
            snapshot = await getDocs(collection(db, 'articulos'));
          }
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
  }, [usuario]);

  const agregarArticulo = async (articulo) => {
    if (!usuario) {
      setError('Debes iniciar sesión para agregar artículos');
      return;
    }
    
    setError(null);

    // Sanitizar inputs
    const nombreSanitizado = sanitizeInput(articulo.nombre);
    const precioSanitizado = parseFloat(articulo.precio);

    // Validaciones
    if (!nombreSanitizado || nombreSanitizado.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (isNaN(precioSanitizado) || precioSanitizado < 0) {
      setError('El precio debe ser un número válido');
      return;
    }

    if (nombreSanitizado.length > 100) {
      setError('El nombre es demasiado largo (máximo 100 caracteres)');
      return;
    }

    let fotoUrl = articulo.foto || null;
    if (articulo.archivo) {
      fotoUrl = await uploadImagen(articulo.archivo);
    }
    const payload = {
      nombre: nombreSanitizado,
      precio: precioSanitizado,
      foto: fotoUrl,
      userId: usuario.uid,
      userEmail: usuario.email,
      createdAt: serverTimestamp(),
      fecha: new Date().toLocaleDateString()
    };
    const ref = await addDoc(collection(db, 'articulos'), payload);
    setArticulos((prev) => [{ id: ref.id, ...payload }, ...prev]);
    return { id: ref.id, ...payload };
  };

  const modificarArticulo = async (id, datosActualizados) => {
    const articulo = articulos.find(art => art.id === id);
    if (!articulo) {
      setError('Artículo no encontrado');
      return;
    }

    const esAdmin = usuario.rol === 'admin';
    const esPropietario = articulo.userId === usuario.uid;

    if (!esAdmin && !esPropietario) {
      setError('No tienes permiso para modificar este artículo');
      return;
    }

    // Sanitizar inputs
    const nombreSanitizado = sanitizeInput(datosActualizados.nombre);
    const precioSanitizado = parseFloat(datosActualizados.precio);

    // Validaciones
    if (!nombreSanitizado || nombreSanitizado.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (isNaN(precioSanitizado) || precioSanitizado < 0) {
      setError('El precio debe ser un número válido');
      return;
    }

    setError(null);
    let fotoUrl = datosActualizados.foto;
    if (datosActualizados.archivo) {
      fotoUrl = await uploadImagen(datosActualizados.archivo);
    }
    const payload = { 
      nombre: nombreSanitizado,
      precio: precioSanitizado,
      foto: fotoUrl 
    };

    const ref = doc(db, 'articulos', id);
    await updateDoc(ref, payload);
    setArticulos((prev) =>
      prev.map((art) => (art.id === id ? { ...art, ...payload } : art))
    );
  };

  const eliminarArticulo = async (id) => {
    if (!usuario) {
      setError('Debes iniciar sesión');
      return;
    }

    // Verificar permisos
    const articulo = articulos.find(art => art.id === id);
    if (!articulo) {
      setError('Artículo no encontrado');
      return;
    }

    const esAdmin = usuario.rol === 'admin';
    const esPropietario = articulo.userId === usuario.uid;

    if (!esAdmin && !esPropietario) {
      setError('No tienes permiso para eliminar este artículo');
      return;
    }

    try {
      setError(null);
      
      // Eliminar imagen de Supabase Storage si existe
      if (articulo.foto) {
        try {
          // Extraer el nombre del archivo de la URL
          const urlParts = articulo.foto.split('/');
          const nombreArchivo = urlParts[urlParts.length - 1];
          
          if (nombreArchivo) {
            const { error: errDelete } = await supabase.storage
              .from(bucket)
              .remove([nombreArchivo]);
            
            if (errDelete) {
              console.warn('Error eliminando imagen de Supabase:', errDelete);
              // Continuar de todas formas, no es un error crítico
            }
          }
        } catch (errImg) {
          console.warn('Error procesando eliminación de imagen:', errImg);
          // Continuar de todas formas
        }
      }
      
      // Eliminar documento de Firestore
      const ref = doc(db, 'articulos', id);
      await deleteDoc(ref);
      setArticulos((prev) => prev.filter((art) => art.id !== id));
    } catch (err) {
      console.error('Error eliminando artículo:', err);
      setError('No se pudo eliminar el artículo');
    }
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
