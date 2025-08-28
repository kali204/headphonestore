// src/components/FeaturedProducts.jsx
import { Link } from 'react-router-dom'
import { Star, ShoppingCart } from 'lucide-react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const FeaturedProducts = ({ products, addItem }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } }
    ]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
      <Slider {...settings}>
        {products.map(product => (
          <div key={product.id} className="px-2">
            <Link to={`/product/${product.id}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer">
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">4.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-emerald-600">₹{product.price}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); addItem(product) }}
                      className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </Slider>
    </div>
  )
}

export default FeaturedProducts
