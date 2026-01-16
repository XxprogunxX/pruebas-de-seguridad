import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import '../styles/Admin.css';

export const Admin = () => {
  const { esAdmin, usuario } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'usuario'
  });

  // Función para sanitizar inputs
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

  useEffect(() => {
    if (esAdmin) {
      cargarUsuarios();
    }
  }, [esAdmin]);

  const cargarUsuarios = async () => {
    setCargando(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const lista = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(lista);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  };

  const cambiarRol = async (userId, nuevoRol) => {
    try {
      setError(null);
      setExito(null);
      const userRef = doc(db, 'usuarios', userId);
      await updateDoc(userRef, { rol: nuevoRol });
      
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: nuevoRol } : u))
      );
      setExito('Rol actualizado correctamente');
    } catch (err) {
      console.error('Error actualizando rol:', err);
      setError('No se pudo actualizar el rol');
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    // Sanitizar inputs
    const emailSanitizado = sanitizeInput(nuevoUsuario.email).toLowerCase();
    const nombreSanitizado = sanitizeInput(nuevoUsuario.nombre);

    // Validaciones
    if (!emailSanitizado || !nuevoUsuario.password || !nombreSanitizado) {
      setError('Completa todos los campos');
      return;
    }

    if (!validarEmail(emailSanitizado)) {
      setError('Email inválido');
      return;
    }

    if (nombreSanitizado.length < 2 || nombreSanitizado.length > 50) {
      setError('El nombre debe tener entre 2 y 50 caracteres');
      return;
    }

    if (nuevoUsuario.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCargando(true);
      
      // Verificar si el email ya existe
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const emailExiste = querySnapshot.docs.some(doc => doc.data().email === emailSanitizado);
      
      if (emailExiste) {
        setError('Este email ya está registrado');
        return;
      }

      // Crear ID único
      const uid = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      // Guardar en Firestore
      await setDoc(doc(db, 'usuarios', uid), {
        email: emailSanitizado,
        password: nuevoUsuario.password,
        nombre: nombreSanitizado,
        rol: nuevoUsuario.rol,
        createdAt: new Date(),
        createdBy: usuario.email
      });

      setExito(`Usuario ${emailSanitizado} creado exitosamente como ${nuevoUsuario.rol}`);
      setNuevoUsuario({ email: '', password: '', nombre: '', rol: 'usuario' });
      setMostrarFormulario(false);
      
      // Recargar lista de usuarios
      await cargarUsuarios();
    } catch (err) {
      console.error('Error creando usuario:', err);
      setError(err.message || 'Error al crear usuario');
    } finally {
      setCargando(false);
    }
  };

  const eliminarUsuario = async (userId, userEmail) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) {
      return;
    }

    try {
      setError(null);
      setExito(null);
      
      await deleteDoc(doc(db, 'usuarios', userId));
      setUsuarios((prev) => prev.filter((u) => u.id !== userId));
      setExito('Usuario eliminado correctamente');
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      setError('No se pudo eliminar el usuario');
    }
  };

  if (!esAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-alert">
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>🔧 Panel de Administración</h1>
      <p className="admin-user">Admin: {usuario?.email}</p>

      {error && <div className="admin-error">{error}</div>}
      {exito && <div className="admin-success">{exito}</div>}

      <div className="crear-usuario-section">
        <button 
          className="btn-toggle-form"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Crear Nuevo Usuario'}
        </button>

        {mostrarFormulario && (
          <form onSubmit={crearUsuario} className="form-crear-usuario">
            <h3>Crear Nuevo Usuario</h3>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                placeholder="Nombre del usuario"
                required
              />
            </div>
            <div className="form-group">
              <label>Rol:</label>
              <select
                value={nuevoUsuario.rol}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-crear" disabled={cargando}>
              {cargando ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>
        )}
      </div>

      <div className="usuarios-table">
        <h2>Gestión de Usuarios</h2>
        {cargando ? (
          <p>Cargando usuarios...</p>
        ) : usuarios.length === 0 ? (
          <p>No hay usuarios registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol Actual</th>
                <th>Cambiar Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.nombre}</td>
                  <td>
                    <span className={`rol-badge rol-${u.rol}`}>{u.rol}</span>
                  </td>
                  <td>
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u.id, e.target.value)}
                      className="rol-select"
                      disabled={u.id === usuario?.uid}
                    >
                      <option value="usuario">Usuario</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn-eliminar-usuario"
                      onClick={() => eliminarUsuario(u.id, u.email)}
                      disabled={u.id === usuario?.uid}
                      title={u.id === usuario?.uid ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
