import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Navbar.css';

export const Navbar = () => {
  const { usuario, logout, cargando } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const resultado = await logout();
    if (resultado.success) {
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Mi Aplicación
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Inicio</Link>
          </li>
          <li className="nav-item">
            <Link to="/blog" className="nav-link">Blog</Link>
          </li>
          {!cargando && usuario ? (
            <>
              <li className="nav-item">
                <span className="nav-usuario">👤 {usuario.nombre}</span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-button logout">
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : !cargando && !usuario ? (
            <li className="nav-item">
              <Link to="/login" className="nav-button login">Iniciar Sesión</Link>
            </li>
          ) : (
            <li className="nav-item">
              <span className="nav-cargando">Cargando...</span>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};
