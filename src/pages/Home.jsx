import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import axios from 'axios'
import FeaturedProductsCarousel from '../components/FeaturedProductsCarousel'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const { addItem } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products?featured=true&limit=10')
      setFeaturedProducts(response.data)
    } catch (error) {
      console.error('Error fetching featured products:', error)
    }
  }

  const handleCategoryClick = (category) => {
    // Save selected category and navigate to Products page
    localStorage.setItem('selectedCategory', category.toLowerCase())
    navigate('/products')
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to HeadphoneStore</h1>
          <p className="text-xl mb-8">Discover amazing products at unbeatable prices</p>
          <Link
            to="/products"
            className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Shop Now
          </Link>
        </div>
      </div>

      {/* Featured Products Carousel */}
      <FeaturedProductsCarousel products={featuredProducts} addItem={addItem} />

      {/* Categories */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['EarBuds', 'Headphones', 'Neckband', 'Speaker'].map(category => (
              <div
                key={category}
                className="bg-white rounded-lg p-6 text-center hover:shadow-md transition cursor-pointer"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
