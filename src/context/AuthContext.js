import React, { createContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import bcrypt from 'bcryptjs';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intentosLogin, setIntentosLogin] = useState({});

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

  // Validar formato de email
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const userData = JSON.parse(usuarioGuardado);
        // Validar que el token no haya expirado (24 horas)
        if (userData.tokenExpira && new Date().getTime() < userData.tokenExpira) {
          setUsuario(userData);
        } else {
          // Token expirado, limpiar sesión
          localStorage.removeItem('usuario');
          console.log('Sesión expirada');
        }
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

      // Sanitizar inputs
      const emailSanitizado = sanitizeInput(email).toLowerCase();
      const nombreSanitizado = sanitizeInput(nombre);

      // Validaciones
      if (!emailSanitizado || !contraseña || !nombreSanitizado) {
        setError('Todos los campos son obligatorios');
        return { success: false, error: 'Todos los campos son obligatorios' };
      }

      if (!validarEmail(emailSanitizado)) {
        setError('Email inválido');
        return { success: false, error: 'Email inválido' };
      }

      if (nombreSanitizado.length < 2 || nombreSanitizado.length > 50) {
        setError('El nombre debe tener entre 2 y 50 caracteres');
        return { success: false, error: 'El nombre debe tener entre 2 y 50 caracteres' };
      }

      if (contraseña.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      // Verificar si el email ya existe
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('email', '==', emailSanitizado));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Este email ya está registrado');
        return { success: false, error: 'Este email ya está registrado' };
      }

      // Crear ID único
      const uid = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      // Encriptar contraseña con bcrypt (salt rounds = 10)
      const hashedPassword = await bcrypt.hash(contraseña, 10);

      // Guardar usuario en Firestore
      await setDoc(doc(db, 'usuarios', uid), {
        email: emailSanitizado,
        password: hashedPassword,
        nombre: nombreSanitizado,
        rol: 'usuario',
        createdAt: new Date()
      });

      // Crear token de sesión con expiración de 24 horas
      const tokenExpira = new Date().getTime() + (24 * 60 * 60 * 1000);
      
      const nuevoUsuario = {
        uid: uid,
        email: emailSanitizado,
        nombre: nombreSanitizado,
        rol: 'usuario',
        tokenExpira: tokenExpira
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

      // Sanitizar y validar
      const emailSanitizado = sanitizeInput(email).toLowerCase();

      // Validaciones
      if (!emailSanitizado || !contraseña) {
        setError('Email y contraseña son obligatorios');
        return { success: false, error: 'Email y contraseña son obligatorios' };
      }

      if (!validarEmail(emailSanitizado)) {
        setError('Email inválido');
        return { success: false, error: 'Email inválido' };
      }

      // Rate limiting: verificar intentos de login
      const ahora = new Date().getTime();
      const intentosPrevios = intentosLogin[emailSanitizado] || { count: 0, lastAttempt: 0 };
      
      // Si han pasado más de 15 minutos, resetear contador
      if (ahora - intentosPrevios.lastAttempt > 15 * 60 * 1000) {
        intentosPrevios.count = 0;
      }
      
      // Bloquear si hay más de 5 intentos fallidos
      if (intentosPrevios.count >= 5) {
        const tiempoEspera = Math.ceil((15 * 60 * 1000 - (ahora - intentosPrevios.lastAttempt)) / 60000);
        setError(`Demasiados intentos fallidos. Espera ${tiempoEspera} minutos`);
        return { success: false, error: `Demasiados intentos fallidos. Espera ${tiempoEspera} minutos` };
      }

      // Buscar usuario por email
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('email', '==', emailSanitizado));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Incrementar intentos fallidos
        setIntentosLogin({
          ...intentosLogin,
          [emailSanitizado]: { count: intentosPrevios.count + 1, lastAttempt: ahora }
        });
        setError('Usuario no encontrado');
        return { success: false, error: 'Usuario no encontrado' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verificar contraseña con bcrypt
      const passwordValida = await bcrypt.compare(contraseña, userData.password);
      
      if (!passwordValida) {
        // Incrementar intentos fallidos
        setIntentosLogin({
          ...intentosLogin,
          [emailSanitizado]: { count: intentosPrevios.count + 1, lastAttempt: ahora }
        });
        setError('Contraseña incorrecta');
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // Login exitoso - resetear intentos y crear token con expiración
      setIntentosLogin({
        ...intentosLogin,
        [emailSanitizado]: { count: 0, lastAttempt: 0 }
      });
      
      // Token válido por 24 horas
      const tokenExpira = new Date().getTime() + (24 * 60 * 60 * 1000);

      const usuarioLogueado = {
        uid: userDoc.id,
        email: userData.email,
        nombre: userData.nombre,
        rol: userData.rol || 'usuario',
        tokenExpira: tokenExpira
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
