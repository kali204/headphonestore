import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const EditProduct = () => {
  const { id } = useParams()
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Make sure id exists and is valid
    if (!id) {
      setError('No product ID provided')
      setLoading(false)
      return
    }

    const token = localStorage.getItem('token') // or get from your auth context
    
    // Use template literals with backticks, not single quotes
    axios.get(`https://headphonestore-cmeo.onrender.com/api/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        setForm(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load product:', err)
        setError('Failed to load product')
        setLoading(false)
      })
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.put(`https://headphonestore-cmeo.onrender.com/api/products/${id}`, form, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      navigate('/admin/products')
    } catch (err) {
      console.error('Failed to update product:', err)
      setError('Failed to update product')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Product</h1>
      <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
        <input 
          className="border p-2 w-full" 
          name="name" 
          value={form.name || ''} 
          onChange={handleChange} 
          placeholder="Product Name"
        />
        <input 
          className="border p-2 w-full" 
          name="category" 
          value={form.category || ''} 
          onChange={handleChange} 
          placeholder="Category"
        />
        <input 
          className="border p-2 w-full" 
          type="number" 
          name="price" 
          value={form.price || ''} 
          onChange={handleChange} 
          placeholder="Price"
        />
        <input 
          className="border p-2 w-full" 
          type="number" 
          name="stock" 
          value={form.stock || ''} 
          onChange={handleChange} 
          placeholder="Stock"
        />
        <input 
          className="border p-2 w-full" 
          name="image" 
          value={form.image || ''} 
          onChange={handleChange} 
          placeholder="Image URL"
        />
        <textarea 
          className="border p-2 w-full" 
          name="description" 
          value={form.description || ''} 
          onChange={handleChange} 
          placeholder="Description"
        />
        <button 
          className="bg-sony text-white px-4 py-2 rounded hover:bg-sonyLight" 
          type="submit"
        >
          Update
        </button>
      </form>
    </div>
  )
}

export default EditProduct
