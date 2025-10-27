import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Randex
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/" className="nav-link">Ana Sayfa</Link>
              <Link to="/appointments" className="nav-link">Randevularım</Link>
              {user?.role === 'business_owner' && (
                <Link to="/my-business" className="nav-link">İşletmelerim</Link>
              )}
              <div className="user-menu">
                <span className="user-name">{user?.name}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Çıkış
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">Ana Sayfa</Link>
              <Link to="/login" className="nav-link">Giriş Yap</Link>
              <Link to="/register" className="btn-register">Kayıt Ol</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
