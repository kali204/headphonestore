import  { useState, useEffect } from 'react'
import { User, Package, MapPin, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const Account = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => {
    fetchOrders()
    fetchAddresses()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/orders/user')
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchAddresses = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/addresses')
      setAddresses(response.data)
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-12 w-12 bg-emerald-100 text-emerald-600 p-2 rounded-full" />
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                activeTab === 'orders' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-50'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                activeTab === 'addresses' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-50'
              }`}
            >
              <MapPin className="h-4 w-4 inline mr-2" />
              Addresses
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-50'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Profile
            </button>
          </nav>
        </div>
        
        <div className="col-span-3">
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Your Orders</h3>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">Order #{order.id}</h4>
                          <p className="text-gray-600 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-lg font-semibold">${order.totalAmount}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No orders found</p>
              )}
            </div>
          )}
          
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Saved Addresses</h3>
              {addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map(address => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <p className="font-semibold">{address.label}</p>
                      <p className="text-gray-600">
                        {address.address}, {address.city}, {address.state} {address.zipCode}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No addresses saved</p>
              )}
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Account
 