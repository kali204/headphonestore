import { useEffect, useState } from "react"
import axios from "axios"
import { Trash } from "lucide-react"

const DeliveryAreasAdmin = () => {
  const [areas, setAreas] = useState([])
  const [form, setForm] = useState({ city: "", pincode: "", active: true })
  const [loading, setLoading] = useState(false)

  const fetchAreas = async () => {
    try {
      const { data } = await axios.get("http://127.0.0.1:5000/api/admin/delivery-areas")
      setAreas(data)
    } catch (err) {
      alert("Failed to load delivery areas.")
      console.error(err)
    }
  }

  useEffect(() => {
    fetchAreas()
  }, [])

  const addArea = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post("http://127.0.0.1:5000/api/admin/delivery-areas", form)
      setForm({ city: "", pincode: "", active: true })
      fetchAreas()
    } catch (err) {
      alert("Could not add area.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm("Remove this delivery area?")) return
    setLoading(true)
    try {
      await axios.delete(`http://127.0.0.1:5000/api/admin/delivery-areas/${id}`)
      fetchAreas()
    } catch (err) {
      alert("Could not remove area.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Delivery Areas</h1>
      <form
        onSubmit={addArea}
        className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <input
          type="text"
          placeholder="City"
          className="border p-2 rounded"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Pincode (optional)"
          className="border p-2 rounded"
          value={form.pincode}
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="mr-2"
          />
          Active
        </label>
        <button
          type="submit"
          className="bg-sony text-white rounded px-4 py-2"
          disabled={!form.city || loading}
        >
          {loading ? "..." : "Add"}
        </button>
      </form>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">City</th>
              <th className="px-4 py-2 text-left">Pincode</th>
              <th className="px-4 py-2 text-left">Active</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2">{a.city}</td>
                <td className="px-4 py-2">{a.pincode || "—"}</td>
                <td className="px-4 py-2">{a.active ? "Yes" : "No"}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => remove(a.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={loading}
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {areas.length === 0 && (
              <tr>
                <td colSpan={4} className="text-gray-500 text-center p-4">
                  No delivery areas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DeliveryAreasAdmin
