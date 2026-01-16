import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import '../styles/Admin.css';

export const Admin = () => {
  const { esAdmin, usuario } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

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
      const userRef = doc(db, 'usuarios', userId);
      await updateDoc(userRef, { rol: nuevoRol });
      
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: nuevoRol } : u))
      );
    } catch (err) {
      console.error('Error actualizando rol:', err);
      setError('No se pudo actualizar el rol');
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
