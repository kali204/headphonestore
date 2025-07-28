import { useState } from 'react'
import { Plus, Edit, Trash, X } from 'lucide-react'

const initialUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@shivalikaudio.com',
    role: 'admin',
  },
  {
    id: 2,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  },
]

const Roles = ['admin', 'user', 'moderator']

const UsersAdmin = () => {
  const [users, setUsers] = useState(initialUsers)
  const [editingUser, setEditingUser] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user' })

  // Open modal for new user add or editing
  const openModal = (user = null) => {
    if (user) {
      setFormData({ name: user.name, email: user.email, role: user.role })
      setEditingUser(user)
    } else {
      setFormData({ name: '', email: '', role: 'user' })
      setEditingUser(null)
    }
    setModalOpen(true)
  }

  // Close modal and reset form
  const closeModal = () => {
    setModalOpen(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'user' })
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Validate email format (simple)
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email)

  // Handle form submit: Add or Update user
  const handleSubmit = (e) => {
    e.preventDefault()
    const { name, email, role } = formData
    if (!name.trim() || !email.trim()) {
      alert('Name and Email are required.')
      return
    }
    if (!isValidEmail(email)) {
      alert('Please enter a valid email address.')
      return
    }

    if (editingUser) {
      // Update existing user
      setUsers(users.map(u => (u.id === editingUser.id ? { ...u, name, email, role } : u)))
      alert('User updated successfully.')
    } else {
      // Add new user - generate simple unique ID
      const newUser = {
        id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name,
        email,
        role,
      }
      setUsers([...users, newUser])
      alert('User added successfully.')
    }
    closeModal()
  }

  // Handle delete user
  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId))
      if (editingUser && editingUser.id === userId) closeModal()
      alert('User deleted.')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <button
          onClick={() => openModal()}
          className="bg-sony text-white px-4 py-2 rounded-lg hover:bg-sonyLight flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full table-auto min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4 capitalize">{user.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-3">
                      <button
                        title="Edit User"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => openModal(user)}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        title="Delete User"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              onClick={closeModal}
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  {Roles.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sony text-white px-4 py-2 rounded hover:bg-sonyLight"
                >
                  {editingUser ? 'Update' : 'Add'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersAdmin
