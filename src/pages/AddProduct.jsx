import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const AddProduct = () => {
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    image: '',
    description: '',
  })
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/api/products', form)
      navigate('/admin/products')
    } catch (err) {
      console.error('Failed to add product:', err)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Add Product</h1>
      <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
        <input className="border p-2 w-full" name="name" placeholder="Product Name" onChange={handleChange} />
        <input className="border p-2 w-full" name="category" placeholder="Category" onChange={handleChange} />
        <input className="border p-2 w-full" type="number" name="price" placeholder="Price" onChange={handleChange} />
        <input className="border p-2 w-full" type="number" name="stock" placeholder="Stock" onChange={handleChange} />
        <input className="border p-2 w-full" name="image" placeholder="Image URL" onChange={handleChange} />
        <textarea className="border p-2 w-full" name="description" placeholder="Description" onChange={handleChange} />
        <button className="bg-sony text-white px-4 py-2 rounded hover:bg-sonyLight" type="submit">Save</button>
      </form>
    </div>
  )
}

export default AddProduct
