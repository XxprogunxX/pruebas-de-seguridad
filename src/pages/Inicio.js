import React from 'react';
import '../styles/Inicio.css';

export const Inicio = () => {
  return (
    <div className="inicio">
      <div className="inicio-hero">
        <h1>Bienvenido a Mi Aplicación</h1>
        <p>Gestiona tu blog de artículos con facilidad</p>
      </div>
      <div className="inicio-features">
        <div className="feature">
          <h3>📝 Blog</h3>
          <p>Lee y consulta artículos publicados</p>
        </div>
        <div className="feature">
          <h3>🔒 Cuenta</h3>
          <p>Inicia sesión para publicar tu contenido</p>
        </div>
        <div className="feature">
          <h3>✏️ Gestiona</h3>
          <p>Agrega, modifica y elimina tus artículos</p>
        </div>
      </div>
    </div>
  );
};
