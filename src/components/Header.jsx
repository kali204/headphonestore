import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ShoppingCart,
  User,
  LogOut,
  Sun,
  Moon,
  Headphones,
  Volume2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./css/Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="audio-header">
      {/* Audio wave background decoration */}
      <div className="audio-waves">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      <div className="header-container">
        <div className="header-content">
          {/* Brand Logo */}
          <Link to="/" className="brand-logo">
            <div className="logo-icon">
              <Headphones className="headphone-icon" />
              <div className="sound-waves">
                <span className="sound-dot dot-1"></span>
                <span className="sound-dot dot-2"></span>
                <span className="sound-dot dot-3"></span>
              </div>
            </div>
            <div className="brand-text">
              <span className="brand-name">AudioVibe</span>
              <span className="brand-tagline">Premium Sound</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="main-nav">
            <Link to="/" className="nav-link">
              <span className="nav-text">Home</span>
              <div className="nav-underline"></div>
            </Link>
            <Link to="/products" className="nav-link">
              <span className="nav-text">Products</span>
              <div className="nav-underline"></div>
            </Link>
            <Link to="/featured" className="nav-link">
              <span className="nav-text">Featured</span>
              <div className="nav-underline"></div>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="header-actions">
            {/* Cart */}
            <Link to="/cart" className="cart-button">
              <div className="cart-icon-wrapper">
                <ShoppingCart className="cart-icon" />
                {cart.length > 0 && (
                  <span className="cart-badge">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              <span className="cart-text">Cart</span>
            </Link>

            {/* Volume/Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <div className="volume-icon">
                {darkMode ? (
                  <Sun className="theme-icon" />
                ) : (
                  <Volume2 className="theme-icon" />
                )}
              </div>
            </button>

            {/* User Profile Link */}
            {user ? (
              <Link to="/profile" className="user-profile-link">
                <div className="user-avatar">
                  <User className="user-icon" />
                </div>
                <span className="user-name">{user.name}</span>
              </Link>
            ) : (
              <Link to="/login" className="login-button">
                <span>Login</span>
                <div className="login-pulse"></div>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mobile-menu-toggle"
            >
              <Menu className="menu-icon" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              <Link 
                to="/" 
                className="mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <Headphones className="mobile-nav-icon" />
                Home
              </Link>
              <Link 
                to="/products" 
                className="mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <Volume2 className="mobile-nav-icon" />
                Products
              </Link>
              <Link 
                to="/featured" 
                className="mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sun className="mobile-nav-icon" />
                Featured
              </Link>
              {user && (
                <Link 
                  to="/profile" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="mobile-nav-icon" />
                  Profile
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
