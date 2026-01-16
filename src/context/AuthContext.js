import React, { createContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const userData = JSON.parse(usuarioGuardado);
        setUsuario(userData);
      } catch (err) {
        console.error('Error cargando sesión:', err);
        localStorage.removeItem('usuario');
      }
    }
    setCargando(false);
  }, []);

  const registro = async (email, contraseña, nombre) => {
    try {
      setError(null);

      // Validaciones
      if (!email || !contraseña || !nombre) {
        setError('Todos los campos son obligatorios');
        return { success: false, error: 'Todos los campos son obligatorios' };
      }

      if (contraseña.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      // Verificar si el email ya existe
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Este email ya está registrado');
        return { success: false, error: 'Este email ya está registrado' };
      }

      // Crear ID único
      const uid = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      // Guardar usuario en Firestore
      await setDoc(doc(db, 'usuarios', uid), {
        email: email,
        password: contraseña,
        nombre: nombre,
        rol: 'usuario',
        createdAt: new Date()
      });

      const nuevoUsuario = {
        uid: uid,
        email: email,
        nombre: nombre,
        rol: 'usuario'
      };

      setUsuario(nuevoUsuario);
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
      return { success: true, usuario: nuevoUsuario };
    } catch (err) {
      console.error('Error en registro:', err);
      const mensajeError = err.message || 'Error al registrar usuario';
      setError(mensajeError);
      return { success: false, error: mensajeError };
    }
  };

  const login = async (email, contraseña) => {
    try {
      setError(null);

      // Validaciones
      if (!email || !contraseña) {
        setError('Email y contraseña son obligatorios');
        return { success: false, error: 'Email y contraseña son obligatorios' };
      }

      // Buscar usuario por email
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Usuario no encontrado');
        return { success: false, error: 'Usuario no encontrado' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verificar contraseña
      if (userData.password !== contraseña) {
        setError('Contraseña incorrecta');
        return { success: false, error: 'Contraseña incorrecta' };
      }

      const usuarioLogueado = {
        uid: userDoc.id,
        email: userData.email,
        nombre: userData.nombre,
        rol: userData.rol || 'usuario'
      };

      setUsuario(usuarioLogueado);
      localStorage.setItem('usuario', JSON.stringify(usuarioLogueado));
      return { success: true, usuario: usuarioLogueado };
    } catch (err) {
      console.error('Error en login:', err);
      const mensajeError = err.message || 'Error al iniciar sesión';
      setError(mensajeError);
      return { success: false, error: mensajeError };
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setUsuario(null);
      localStorage.removeItem('usuario');
      return { success: true };
    } catch (err) {
      console.error('Error en logout:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const value = {
    usuario,
    login,
    logout,
    registro,
    cargando,
    error,
    setError,
    estaAutenticado: !!usuario,
    esAdmin: usuario?.rol === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
