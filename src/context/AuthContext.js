import React, { createContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      if (usuarioFirebase) {
        setUsuario({
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email,
          nombre: usuarioFirebase.displayName || usuarioFirebase.email.split('@')[0]
        });
      } else {
        setUsuario(null);
      }
      setCargando(false);
    });

    return unsubscribe;
  }, []);

  const registro = async (email, contraseña, nombre) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        contraseña
      );

      const nuevoUsuario = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        nombre: nombre
      };

      setUsuario(nuevoUsuario);
      return { success: true, usuario: nuevoUsuario };
    } catch (err) {
      const mensajeError =
        err.code === 'auth/email-already-in-use'
          ? 'Este email ya está registrado'
          : err.code === 'auth/weak-password'
          ? 'La contraseña debe tener al menos 6 caracteres'
          : err.message;

      setError(mensajeError);
      return { success: false, error: mensajeError };
    }
  };

  const login = async (email, contraseña) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, contraseña);
      
      const nuevoUsuario = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        nombre: userCredential.user.displayName || email.split('@')[0]
      };
      setUsuario(nuevoUsuario);
      return { success: true, usuario: nuevoUsuario };
    } catch (err) {
      const mensajeError = err.code === 'auth/user-not-found'
        ? 'Usuario no encontrado'
        : err.code === 'auth/wrong-password'
        ? 'Contraseña incorrecta'
        : err.message;
      setError(mensajeError);
      return { success: false, error: mensajeError };
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUsuario(null);
      return { success: true };
    } catch (err) {
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
    estaAutenticado: !!usuario
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
