import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const EditProduct = () => {
  const { id } = useParams()
  const [form, setForm] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`)
      .then(res => setForm(res.data))
      .catch(err => console.error('Failed to load product:', err))
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`http://localhost:5000/api/products/${id}`, form)
      navigate('/admin/products')
    } catch (err) {
      console.error('Failed to update product:', err)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Product</h1>
      <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
        <input className="border p-2 w-full" name="name" value={form.name || ''} onChange={handleChange} />
        <input className="border p-2 w-full" name="category" value={form.category || ''} onChange={handleChange} />
        <input className="border p-2 w-full" type="number" name="price" value={form.price || ''} onChange={handleChange} />
        <input className="border p-2 w-full" type="number" name="stock" value={form.stock || ''} onChange={handleChange} />
        <input className="border p-2 w-full" name="image" value={form.image || ''} onChange={handleChange} />
        <textarea className="border p-2 w-full" name="description" value={form.description || ''} onChange={handleChange} />
        <button className="bg-sony text-white px-4 py-2 rounded hover:bg-sonyLight" type="submit">Update</button>
      </form>
    </div>
  )
}

export default EditProduct
