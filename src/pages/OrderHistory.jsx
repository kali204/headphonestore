import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './css/OrderHistory.css'; // Assuming you have a CSS file for styling

const currency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const OrderHistory = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({}); // { [orderId]: boolean }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Kick unauthenticated users to login
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        
        const res = await fetch('https://headphonestore-cmeo.onrender.com/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (!token) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Order History</h1>
        <p className="text-center text-gray-500">Loading orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Order History</h1>
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
          const badge =
            statusStyles[order.status?.toLowerCase?.()] ||
            'bg-gray-100 text-gray-800';

          return (
            <div
              key={order.id}
              className="bg-white shadow rounded-lg p-4 border"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    Order #{order.id}
                  </p>

                  <span
                    className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${badge}`}
                  >
                    {order.status}
                  </span>

                  <p className="text-gray-600 mt-2">
                    Date:{' '}
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">
                    {currency(order.total)}
                  </p>

                  {/* Expand items */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="mt-2 text-sm text-sony hover:underline inline-flex items-center"
                  >
                    {expanded[order.id] ? (
                      <>
                        Hide items <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        View items <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Items list (if present) */}
              {expanded[order.id] && (
                <div className="mt-4 border-t pt-3 text-sm text-gray-700">
                  {order.items && order.items.length > 0 ? (
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li
                          key={item.id || item.product_id}
                          className="flex justify-between"
                        >
                          <span>
                            {item.name || `Product #${item.product_id}`} × {item.quantity}
                          </span>
                          <span>{currency(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">
                      (Items not returned by API. Add
                      <code className="mx-1 bg-gray-100 px-1 rounded">
                        include_items
                      </code>
                      support to your backend if you want to display them.)
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
