import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import "./css/Hero.css";

const Hero = () => {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await axios.get("https://headphonestore-cmeo.onrender.com/api/products");
        setImages(data.slice(0, 6));
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load images", error);
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (!images.length) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000); // Slightly longer interval
    return () => clearInterval(timerRef.current);
  }, [images.length]);

  const prev = () => {
    clearInterval(timerRef.current);
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const next = () => {
    clearInterval(timerRef.current);
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index) => {
    clearInterval(timerRef.current);
    setCurrent(index);
  };

  const currentProduct = images[current];

  return (
    <section className="hero-section">
      {/* Animated background */}
      <div className="hero-bg">
        <div className="bg-overlay"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[600px]">
          {/* Left Text Section */}
          <div className="hero-content">
            <div className="hero-badge">
              <span>New Collection</span>
            </div>
            
            <h1 className="hero-title">
              Experience 
              <span className="gradient-text"> Pure Audio</span>
            </h1>
            
            <p className="hero-description">
              Discover Sony's latest collection of premium headphones and
              earphones with industry-leading sound quality and cutting-edge technology.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Products</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.9</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>

            <div className="hero-buttons">
              <Link to="/products" className="btn-primary">
                <span>Shop Now</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link to="/about" className="btn-secondary">
                Learn More
              </Link>
            </div>
          </div>

          {/* Right - Image Carousel */}
          <div className="hero-carousel">
            {isLoading ? (
              <div className="carousel-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div className="carousel-container">
                {currentProduct && (
                  <Link
                    to={`/product/${currentProduct.id}`}
                    className="carousel-image-wrapper"
                  >
                    <div className="image-frame">
                      <img
                        src={currentProduct.image}
                        alt={currentProduct.name}
                        className="carousel-image"
                      />
                      <div className="image-glow"></div>
                    </div>
                    
                    <div className="product-info">
                      <h3 className="product-name">{currentProduct.name}</h3>
                      <p className="product-price">₹{currentProduct.price.toLocaleString()}</p>
                    </div>
                  </Link>
                )}

                {/* Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <button onClick={prev} className="carousel-btn carousel-btn-prev">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={next} className="carousel-btn carousel-btn-next">
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                <div className="carousel-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`dot ${i === current ? "active" : ""}`}
                    />
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      animation: `progress 4s linear infinite`,
                      animationDelay: `-${(current * 4000)}ms`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
