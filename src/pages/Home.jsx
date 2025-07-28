import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, ArrowRight, Users, Award, Headphones } from "lucide-react";
import { useCart } from "../context/CartContext";
import Hero from "./Hero";
import axios from "axios";
import "./css/FeaturedProducts.css"; // Import the 3D carousel CSS

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
const Home = () => {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/api/products`);
        setProducts(data.slice(0, 6)); // Use 6 products for carousel symmetry
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div>
      {/* HERO SECTION */}
      <Hero />

      {/* FEATURED PRODUCTS - 3D Carousel */}
      {products.length > 0 && (
        <section className="featured-section">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our handpicked selection of premium audio products with cutting-edge technology
              </p>
            </div>

            <div className="featured-carousel">
              <div
                className="featured-slider"
                style={{ "--quantity": products.length }}
              >
                {products.map((product, idx) => (
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
                                i < (product.rating || 4) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
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

            <div className="text-center mt-12">
              <Link 
                to="/featured" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                View All Featured Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ABOUT US SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Audio Products?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We're passionate about delivering exceptional audio experiences through 
                premium quality products and innovative technology that transforms the way you listen.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Quality</h3>
                    <p className="text-gray-600">Industry-leading sound quality with cutting-edge audio technology</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
                    <p className="text-gray-600">24/7 customer support with audio specialists ready to help</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Wide Selection</h3>
                    <p className="text-gray-600">From studio monitors to wireless earbuds, we have it all</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=400&fit=crop"
                alt="Audio Experience"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl opacity-20"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">50K+</div>
              <div className="text-gray-300">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">200+</div>
              <div className="text-gray-300">Products</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">4.9</div>
              <div className="text-gray-300">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive range of audio products designed for every listening preference
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Headphones */}
            <Link to="/products?category=headphones" className="group">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop"
                    alt="Headphones"
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Headphones</h3>
                  <p className="text-gray-600 mb-4">
                    Premium over-ear and on-ear headphones for audiophiles
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold">
                    Explore Collection
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Earphones */}
            <Link to="/products?category=earphones" className="group">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=300&fit=crop"
                    alt="Earphones"
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Earphones</h3>
                  <p className="text-gray-600 mb-4">
                    Wireless and wired in-ear earphones for every lifestyle
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold">
                    Explore Collection
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Speakers */}
            <Link to="/products?category=speakers" className="group md:col-span-2 lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=300&fit=crop"
                    alt="Speakers"
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Speakers</h3>
                  <p className="text-gray-600 mb-4">
                    High-quality speakers for home and professional use
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold">
                    Explore Collection
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Latest Products
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Get exclusive deals, new product announcements, and audio tips delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
