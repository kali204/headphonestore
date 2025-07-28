import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, ShoppingCart, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      const productsData = response.data;
      setProducts(productsData);

      const uniqueCategories = ['all', ...new Set(productsData.map((p) => p.category))];
      setCategories(uniqueCategories);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products. Please try again later.');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...products];
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, categoryFilter, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setSortBy('name');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sony"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 font-semibold py-16">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Products</h1>

      {/* Filter & Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 dark:text-gray-200" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
        >
          <option value="name">Sort by Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>

        <button
          onClick={handleClearFilters}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          Clear Filters
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <Link to={`/product/${product.id}`}>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover hover:scale-105 transition-transform"
              />
            </Link>

            <div className="p-4">
              <Link to={`/product/${product.id}`}>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white hover:text-sony">
                  {product.name}
                </h3>
              </Link>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < product.rating ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  ({product.reviews})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-sony dark:text-sonyLight">
                  ₹{product.price.toLocaleString()}
                </span>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-sony text-white p-2 rounded-lg hover:bg-sonyLight"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Products */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-300">
            No products found matching your criteria.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-sony text-white rounded-lg hover:bg-sonyLight"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
