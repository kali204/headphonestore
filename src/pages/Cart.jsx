import  { Link } from 'react-router-dom'
import { Trash, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const Cart = () => {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some products to get started!</p>
        <Link
          to="/products"
          className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
        >
          Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {items.map(item => (
          <div key={item.id} className="flex items-center p-6 border-b last:border-b-0">
            <img
              src={item.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100'}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg mr-4"
            />
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <p className="text-gray-600">₹{item.price}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <span className="font-semibold text-lg min-w-[4rem]">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
              
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-600 hover:text-red-800 p-2"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center text-xl font-bold mb-4">
          <span>Total: ₹{total.toFixed(2)}</span>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={clearCart}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Clear Cart
          </button>
          <Link
            to="/checkout"
            className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition text-center"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart
 