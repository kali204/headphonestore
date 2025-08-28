import  { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Star, ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import axios from 'axios'

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/${id}`)
      setProduct(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching product:', error)
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    addItem(product, quantity)
    alert('Product added to cart!')
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600'}
            alt={product.name}
            className="w-full rounded-lg shadow-md"
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
            <span className="text-gray-600 ml-2">(128 reviews)</span>
          </div>
          
          <p className="text-4xl font-bold text-emerald-600 mb-6">${product.price}</p>
          
          <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Category:</h3>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm capitalize">{product.category}</span>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <label className="font-semibold">Quantity:</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
          </div>
          
          <div className="mt-8 border-t pt-8">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• 15-day return policy</li>
              <li>• 1-year warranty included</li>
              <li>• Customer support available 24/7</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
 