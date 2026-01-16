import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [nombre, setNombre] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { login, registro, error, setError, usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  if (usuario && !cargando) {
    navigate('/blog');
  }

  const limpiarErrores = () => {
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    limpiarErrores();

    if (!email || !contraseña) {
      setError('Por favor completa todos los campos');
      setCargando(false);
      return;
    }
    if (email.length > 60) {
        setError('El email es demasiado largo');
        setCargando(false);
        return;
    }
    if (nombre.length  > 20) {
        setError('El nombre es demasiado largo');
        setCargando(false);
        return;
    }


    if (esRegistro && !nombre) {
      setError('Por favor ingresa tu nombre');
      setCargando(false);
      return;
    }
    if (contraseña.length > 15) {
        setError('La contraseña es demasiado larga');
        setCargando(false);
    return;
    }


    try {
      if (esRegistro) {
        const resultado = await registro(email, contraseña, nombre);
        if (resultado.success) {
          navigate('/blog');
        }
      } else {
        const resultado = await login(email, contraseña);
        if (resultado.success) {
          navigate('/blog');
        }
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const cambiarModo = () => {
    limpiarErrores();
    setEmail('');
    setContraseña('');
    setNombre('');
    setEsRegistro(!esRegistro);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>{esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          {esRegistro && (
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                disabled={cargando}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={cargando}
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              placeholder={esRegistro ? 'Al menos 6 caracteres' : 'contraseña'}
              disabled={cargando}
            />
          </div>
          
          <button type="submit" className="btn-login" disabled={cargando}>
            {cargando ? 'Cargando...' : esRegistro ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button 
              type="button" 
              className="btn-toggle"
              onClick={cambiarModo}
              disabled={cargando}
            >
              {esRegistro ? 'Inicia Sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
