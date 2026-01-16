import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedAdminRoute = ({ children }) => {
  const { usuario, cargando, esAdmin } = useContext(AuthContext);

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  if (!esAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Acceso Denegado</h2>
        <p>Solo administradores pueden acceder a esta página.</p>
      </div>
    );
  }

  return children;
};
