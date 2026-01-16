import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BlogProvider } from './context/BlogContext';
import { Navbar } from './components/Navbar';
import { Inicio } from './pages/Inicio';
import { Blog } from './pages/Blog';
import { Login } from './pages/Login';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <BlogProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </BlogProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
