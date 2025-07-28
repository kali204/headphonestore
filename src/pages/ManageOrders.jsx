import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['pending', 'completed', 'cancelled', 'refunded'];

const ManageOrders = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!token || user?.role !== 'admin') return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('https://headphonestore-cmeo.onrender.com/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Change status to "${status}"?`)) return;
    setUpdatingId(id);
    try {
      await axios.patch(
        `https://headphonestore-cmeo.onrender.com/api/admin/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  if (loading) {
    return <div className="p-6">Loading orders…</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-600">Filter:</label>
        <select
          className="border rounded px-2 py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {visibleOrders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Items</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3 font-medium">#{o.id}</td>
                  <td className="px-4 py-3">{o.user?.name}</td>
                  <td className="px-4 py-3">{o.user?.email}</td>
                  <td className="px-4 py-3">{o.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {o.address}{o.city ? `, ${o.city}` : ''}{o.pincode ? ` - ${o.pincode}` : ''}
                  </td>
                  <td className="px-4 py-3">₹{o.total}</td>
                  <td className="px-4 py-3">
                    <select
                      disabled={updatingId === o.id}
                      className="border rounded px-2 py-1"
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleExpand(o.id)}
                      className="flex items-center text-sony hover:text-sonyLight"
                    >
                      {expanded[o.id] ? (
                        <>
                          Hide <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          View <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                    {expanded[o.id] && (
                      <div className="mt-2 bg-gray-50 rounded p-2">
                        {o.items?.length ? (
                          o.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-xs py-1">
                              <span>{it.name} × {it.quantity}</span>
                              <span>₹{(it.price * it.quantity).toLocaleString()}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">No items</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
