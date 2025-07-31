import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import DeliveryAreasAdmin from './DeliveryAreasAdmin'
import ManageOrders from './ManageOrders'
import AddProduct from './AddProduct'
import EditProduct from './EditProduct'
import axios from 'axios'
import { Line } from 'react-chartjs-2'

import { BarChart3, Package,Settings, Plus, Edit, Trash, ClipboardList } from 'lucide-react'

import 'chart.js/auto'

// ------------------ Layout ------------------
const AdminLayout = ({ children }) => {
  const location = useLocation()

  const navItems = [
    { path: '/admin', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/delivery-areas', icon: Settings, label: 'Delivery Areas' }
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-sony">Admin Panel</h1>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
                location.pathname === item.path ? 'bg-blue-50 text-sony border-r-2 border-sony' : ''
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

// ------------------ Dashboard ------------------
const Dashboard = () => {
  const [stats, setStats] = useState({ orders: 0, sales: 0, products: 0, users: 0 })
  const [revenueData, setRevenueData] = useState([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    fetchStats()
    fetchRevenue()
  }, [dateRange])

  const fetchStats = async () => {
    try {
      const response = await axios.get('https://headphonestore-cmeo.onrender.com/api/admin/stats', { params: dateRange })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchRevenue = async () => {
    try {
      const response = await axios.get('https://headphonestore-cmeo.onrender.com/api/admin/revenue-series', { params: dateRange })
      setRevenueData(response.data)
    } catch (error) {
      console.error('Failed to fetch revenue data:', error)
    }
  }

  const chartData = {
    labels: revenueData.map((d) => d.date),
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.map((d) => d.sales),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3
      }
    ]
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Date Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          className="border rounded p-2"
        />
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          className="border rounded p-2"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { title: 'Total Sales', value: `₹${stats.sales.toLocaleString()}` },
          { title: 'Orders', value: stats.orders },
          { title: 'Products', value: stats.products },
          { title: 'Users', value: stats.users }
        ].map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Revenue Trend</h2>
        <Line data={chartData} />
      </div>
    </div>
  )
}

// ------------------ Products ------------------
const ProductsAdmin = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('https://headphonestore-cmeo.onrender.com/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  // Delete handler - FIXED template literal syntax
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token')
        // Using backticks for template literal
        await axios.delete(`https://headphonestore-cmeo.onrender.com/api/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        fetchProducts()
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          onClick={() => navigate('/admin/add-product')}
          className="bg-sony text-white px-4 py-2 rounded-lg hover:bg-sonyLight flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded mr-4" />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 capitalize">{product.category}</td>
                <td className="px-6 py-4">₹{product.price.toLocaleString()}</td>
                <td className="px-6 py-4">{product.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      // FIXED - Using backticks for template literal
                      onClick={() => navigate(`/admin/edit-product/${product.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}





// ------------------ Settings ------------------
const SettingsAdmin = () => {
  const [storeName, setStoreName] = useState('Sony Store')
  const [maintenance, setMaintenance] = useState(false)
  const [password, setPassword] = useState('')

  const handleSaveSettings = async () => {
    try {
      await axios.post('https://headphonestore-cmeo.onrender.com/api/admin/settings', {
        storeName,
        maintenance
      })
      alert('Settings updated successfully!')
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings.')
    }
  }

  const handleChangePassword = async () => {
    if (!password.trim()) return alert('Password cannot be empty!')
    try {
      await axios.post('https://headphonestore-cmeo.onrender.com/api/admin/change-password', { password })
      alert('Password changed successfully!')
      setPassword('')
    } catch (error) {
      console.error('Failed to change password:', error)
      alert('Failed to change password.')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Store Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Store Name</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Maintenance Mode */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Maintenance Mode</label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="h-5 w-5"
            />
            <span>{maintenance ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>

        {/* Change Password */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Change Admin Password</label>
          <div className="flex space-x-2">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 border rounded-lg p-2"
            />
            <button
              onClick={handleChangePassword}
              className="bg-sony text-white px-4 py-2 rounded-lg hover:bg-sonyLight"
            >
              Change
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-right">
          <button
            onClick={handleSaveSettings}
            className="bg-sony text-white px-4 py-2 rounded-lg hover:bg-sonyLight"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

// ------------------ Main Component ------------------
const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductsAdmin />} />
        <Route path="/orders" element={<ManageOrders />} />
        <Route path="/settings" element={<SettingsAdmin />} />
        <Route path="/delivery-areas" element={<DeliveryAreasAdmin />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
      </Routes>
    </AdminLayout>
  )
}

export default AdminDashboard
