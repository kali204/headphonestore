import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./css/OrderHistory.css"; // Assuming you have a CSS file for styling

// Helper function to format currency
const currency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );

// Styles for different order statuses
const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const OrderHistory = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({}); // Tracks expanded state for each order
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Kick unauthenticated users to the login page
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch order history when the component mounts or token changes
  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://headphonestore-cmeo.onrender.com/order-history", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
});

        if (!res.ok) {
          throw new Error("Failed to fetch orders. Please try again later.");
        }
        
        const data = await res.json();
        
        // Ensure the API returned a valid array
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          throw new Error("Received invalid data format from the server.");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  // Toggles the visibility of an order's item list
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Cancels a pending order
  const cancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    const originalOrders = [...orders]; // Store original state for rollback

    // Optimistic UI update: change status immediately
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: "cancelled" } : order
      )
    );

    try {
      const res = await fetch(
        `https://headphonestore-cmeo.onrender.com/api/orders/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to cancel order.");
      }
      // If successful, the optimistic update is now permanent
    } catch (err) {
      alert(err.message);
      // On failure, revert the UI to its original state
      setOrders(originalOrders);
    }
  };

  // Don't render anything if the user is being redirected
  if (!token) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading orders…</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badgeClass =
              statusStyles[order.status?.toLowerCase()] || "bg-gray-100 text-gray-800";

            return (
              <div
                key={order.id}
                className="bg-white shadow rounded-lg p-4 border"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">Order #{order.id}</p>
                    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${badgeClass}`}>
                      {order.status}
                    </span>
                    <p className="text-gray-600 mt-2 text-sm">
                      Date: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">{currency(order.total)}</p>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="mt-2 text-sm text-blue-600 hover:underline inline-flex items-center"
                    >
                      {expanded[order.id] ? (
                        <>Hide items <ChevronUp className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>View items <ChevronDown className="w-4 h-4 ml-1" /></>
                      )}
                    </button>
                    {order.status === "pending" && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="mt-2 text-sm text-red-600 hover:underline block"
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                </div>

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
                      <p className="text-gray-500">Item details are not available for this order.</p>
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