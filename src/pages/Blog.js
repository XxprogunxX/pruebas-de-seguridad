import React, { useState, useContext } from 'react';
import { BlogContext } from '../context/BlogContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/Blog.css';

export const Blog = () => {
  const { articulos, agregarArticulo, modificarArticulo, eliminarArticulo, cargando, error, setError } = useContext(BlogContext);
  const { estaAutenticado } = useContext(AuthContext);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', precio: '', foto: '' });
  const [archivo, setArchivo] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.precio) {
      setError('Por favor completa nombre y precio');
      return;
    }

    if (editandoId) {
      modificarArticulo(editandoId, { ...formData, archivo });
      setEditandoId(null);
    } else {
      agregarArticulo({ ...formData, archivo });
    }
    setFormData({ nombre: '', precio: '', foto: '' });
    setArchivo(null);
    setMostrarFormulario(false);
  };

  const handleEditar = (articulo) => {
    setFormData({ nombre: articulo.nombre, precio: articulo.precio, foto: articulo.foto });
    setEditandoId(articulo.id);
    setArchivo(null);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setFormData({ nombre: '', precio: '', foto: '' });
    setArchivo(null);
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  return (
    <div className="blog-container">
      <h1>Blog de Artículos</h1>
      {error && <p className="mensaje-login" style={{color: '#c33', background:'#fee', border:'1px solid #f2c2c2'}}>{error}</p>}
      
      {estaAutenticado ? (
        <div className="blog-admin">
          <button 
            className="btn-agregar"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? 'Cancelar' : '+ Agregar Artículo'}
          </button>

          {mostrarFormulario && (
            <form className="formulario-articulo" onSubmit={handleSubmit}>
              <h3>{editandoId ? 'Modificar Artículo' : 'Nuevo Artículo'}</h3>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre del artículo"
                />
              </div>
              <div className="form-group">
                <label>Precio:</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  placeholder="Precio"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>URL Foto:</label>
                <input
                  type="text"
                  name="foto"
                  value={formData.foto}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/foto.jpg"
                />
              </div>
              <div className="form-group">
                <label>Subir imagen (Supabase Storage):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-guardar">
                  {editandoId ? 'Actualizar' : 'Guardar'}
                </button>
                <button type="button" className="btn-cancelar" onClick={handleCancelar}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <p className="mensaje-login">Inicia sesión para publicar artículos</p>
      )}

      <div className="articulos-lista">
        {cargando ? (
          <p className="sin-articulos">Cargando artículos...</p>
        ) : articulos.length === 0 ? (
          <p className="sin-articulos">No hay artículos aún</p>
        ) : (
          articulos.map(articulo => (
            <div key={articulo.id} className="articulo-card">
              {articulo.foto && (
                <img src={articulo.foto} alt={articulo.nombre} className="articulo-foto" />
              )}
              <div className="articulo-contenido">
                <h3>{articulo.nombre}</h3>
                <p className="articulo-precio">${articulo.precio}</p>
                <p className="articulo-fecha">{articulo.fecha || 'Sin fecha'}</p>
                {estaAutenticado && (
                  <div className="articulo-acciones">
                    <button 
                      className="btn-editar"
                      onClick={() => handleEditar(articulo)}
                    >
                      Modificar
                    </button>
                    <button 
                      className="btn-eliminar"
                      onClick={() => eliminarArticulo(articulo.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
