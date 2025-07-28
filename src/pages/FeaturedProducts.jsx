import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, Filter, Grid, List } from "lucide-react";
import { useCart } from "../context/CartContext";
import axios from "axios";
import "./css/FeaturedProducts.css";

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('carousel'); // carousel, grid, list
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get("https://headphonestore-cmeo.onrender.com/api/products");
        setProducts(data);
        setFilteredProducts(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Keep original order for 'featured'
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, sortBy]);

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="featured-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading featured products...</p>
      </div>
    );
  }

  return (
    <div className="featured-products-page">
      {/* Hero Header */}
      <section className="featured-hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center text-white py-20">
            <h1 className="featured-hero-title">
              Featured Products
            </h1>
            <p className="featured-hero-subtitle">
              Discover our handpicked selection of premium audio products
            </p>
            <div className="featured-stats">
              <div className="stat-card">
                <span className="stat-number">{products.length}+</span>
                <span className="stat-label">Products</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">4.9</span>
                <span className="stat-label">Average Rating</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Carousel Section */}
      {viewMode === 'carousel' && filteredProducts.length > 0 && (
        <section className="featured-section">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="section-title">Featured Collection</h2>
            <div className="featured-carousel">
              <div
                className="featured-slider"
                style={{ "--quantity": Math.min(filteredProducts.length, 8) }}
              >
                {filteredProducts.slice(0, 8).map((product, idx) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="product-card"
                    style={{ "--position": idx + 1 }}
                  >
                    <div className="bg-white rounded-lg shadow-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                      />
                      <div className="card-content">
                        <h3>{product.name}</h3>
                        <div className="rating">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (product.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="price">
                          ₹{product.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Controls and Filters */}
      <section className="controls-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="controls-wrapper">
            {/* View Mode Toggle */}
            <div className="view-controls">
              <button
                onClick={() => setViewMode('carousel')}
                className={`view-btn ${viewMode === 'carousel' ? 'active' : ''}`}
              >
                3D View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                <Grid className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>

            {/* Filters */}
            <div className="filter-controls">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid/List View */}
      {(viewMode === 'grid' || viewMode === 'list') && (
        <section className="products-grid-section">
          <div className="max-w-7xl mx-auto px-4">
            <div className={`products-container ${viewMode}`}>
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <Link to={`/product/${product.id}`} className="product-link">
                    <div className="product-image">
                      <img src={product.image} alt={product.name} />
                      <div className="product-overlay">
                        <span>View Details</span>
                      </div>
                    </div>
                    <div className="product-details">
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-rating">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (product.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="rating-count">({product.reviews || 0})</span>
                      </div>
                      <div className="product-price">
                        ₹{product.price.toLocaleString()}
                      </div>
                      {product.originalPrice && (
                        <div className="original-price">
                          ₹{product.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                    className="add-to-cart-btn"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Products Found */}
      {filteredProducts.length === 0 && !loading && (
        <section className="no-products">
          <div className="max-w-7xl mx-auto px-4 text-center py-20">
            <h3 className="text-2xl font-bold mb-4">No products found</h3>
            <p className="text-gray-600 mb-8">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('featured');
              }}
              className="reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default FeaturedProducts;
