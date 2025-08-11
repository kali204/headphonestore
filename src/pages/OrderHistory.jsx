import { useEffect, useState } from "react";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token not found. Please login.");
          return;
        }

        const res = await fetch(
          "https://headphonestore-cmeo.onrender.com/order-history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Failed to fetch order history");
        } else {
          setOrders(data);
          setError("");
        }
      } catch (err) {
        setError("Something went wrong");
      }
    };

    fetchOrders();
  }, []);

  const cancelOrder = async (orderId) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `https://headphonestore-cmeo.onrender.com/api/orders/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to cancel order");
      } else {
        alert(data.message);
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: "cancelled" } : order
          )
        );
      }
    } catch {
      alert("Error cancelling order");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Order History</h2>
      {error && <p className="text-red-500">{error}</p>}
      {orders.length === 0 && !error && <p>No orders found.</p>}
      {orders.map((order) => (
        <div key={order.id} className="border p-4 mb-4 rounded shadow-sm">
          <p>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Total:</strong> ₹{order.total}
          </p>
          <p>
            <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Payment Method:</strong> {order.payment_method || "N/A"}
          </p>
          <div className="mt-2">
            <strong>Items:</strong>
            <ul className="list-disc ml-6">
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.name} - {item.quantity} pcs @ ₹{item.price}
                </li>
              ))}
            </ul>
          </div>
          {(order.status === "pending" ||
            (order.status === "completed" )) && (
            <button
              className="mt-3 bg-red-500 text-white px-3 py-1 rounded"
              onClick={() => cancelOrder(order.id)}
            >
              Cancel Order
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;
