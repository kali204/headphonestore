import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { user } = useAuth(); // Get logged-in user
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const navigate = useNavigate();

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your cart</h1>
        <Link
          to="/login"
          className="bg-sony text-white px-6 py-3 rounded-lg hover:bg-sonyLight"
        >
          Login
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">
          Add some amazing Sony audio products to get started!
        </p>
        <Link
          to="/products"
          className="bg-sony text-white px-6 py-3 rounded-lg hover:bg-sonyLight"
        >
          Shop Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center p-6 border-b last:border-b-0">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg mr-4"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-gray-600">{item.description}</p>
              <p className="text-sony font-bold text-lg">
                ₹{item.price.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold w-8 text-center">{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button 
                onClick={() => removeFromCart(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center text-xl font-bold mb-6">
          <span>Total: ₹{getTotalPrice().toLocaleString()}</span>
        </div>
        <Link 
          to="/checkout"
          className="w-full bg-sony text-white py-3 rounded-lg hover:bg-sonyLight font-semibold text-center block"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
};

export default Cart;
