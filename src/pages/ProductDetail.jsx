import  { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import axios from 'axios'

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [currentImage, setCurrentImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await axios.get('https://headphonestore-cmeo.onrender.com/api/products')
      const foundProduct = response.data.find(p => p.id === parseInt(id))
      setProduct(foundProduct)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch product:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sony"></div>
      </div>
    )
  }

  if (!product) {
    return <div className="text-center py-16">Product not found</div>
  }

  const images = [product.image, product.image, product.image]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="relative mb-4">
            <img 
              src={images[currentImage]} 
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          
          <div className="flex space-x-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  currentImage === index ? 'border-sony' : 'border-gray-200'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < product.rating ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="ml-2 text-gray-500">({product.reviews} reviews)</span>
          </div>
          
          <div className="text-4xl font-bold text-sony mb-6">₹{product.price.toLocaleString()}</div>
          
          <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
          
          {product.specs && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">Specifications</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{product.specs}</pre>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => addToCart(product)}
            className="w-full bg-sony text-white py-4 rounded-lg hover:bg-sonyLight font-semibold flex items-center justify-center text-lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </button>
          
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p>✓ Free shipping on orders over ₹2,000</p>
            <p>✓ 1 year warranty</p>
            <p>✓ 30-day return policy</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
 