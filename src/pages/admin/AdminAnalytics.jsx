import  { useState, useEffect } from 'react'
import { TrendingUp, Users, Package, ShoppingCart } from 'lucide-react'
import axios from 'axios'

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    salesOverTime: [],
    topProducts: [],
    categoryBreakdown: [],
    monthlyRevenue: 0,
    monthlyOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0
  })

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/analytics')
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold">₹{analytics.monthlyRevenue}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Monthly Orders</p>
              <p className="text-3xl font-bold">{analytics.monthlyOrders}</p>
            </div>
            <ShoppingCart className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Average Order</p>
              <p className="text-3xl font-bold">₹{analytics.averageOrderValue}</p>
            </div>
            <Package className="h-12 w-12 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold">{analytics.totalCustomers}</p>
            </div>
            <Users className="h-12 w-12 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {analytics.topProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=50'}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover mr-3"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-gray-600 text-sm">{product.totalSold} sold</p>
                  </div>
                </div>
                <span className="font-semibold">${product.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Sales by Category</h2>
          <div className="space-y-4">
            {analytics.categoryBreakdown.map(category => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    category.name === 'earbuds' ? 'bg-blue-500' :
                    category.name === 'headphone' ? 'bg-pink-500' :
                    category.name === 'neckband' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <span className="capitalize">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{category.revenue}</p>
                  <p className="text-gray-600 text-sm">{category.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Sales Over Time</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-2" />
            <p>Sales chart would be displayed here</p>
            <p className="text-sm">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
 