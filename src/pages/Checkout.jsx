import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, MapPin, Phone, CreditCard, Edit3, Check } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./css/Checkout.css";

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    pincode: "",
    phone: "",
  });

  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  const { cart, getTotalPrice, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  /** Derived: unique list of active cities */
  const activeCities = useMemo(() => {
    const cities = deliveryAreas
      .filter(a => a.active)
      .map(a => a.city?.trim())
      .filter(Boolean);
    return [...new Set(cities)];
  }, [deliveryAreas]);

  /** Derived: valid pincodes for the selected city */
  const validPincodesForCity = useMemo(() => {
    if (!formData.city) return [];
    const pins = deliveryAreas
      .filter(a => a.active && a.city?.toLowerCase() === formData.city.toLowerCase())
      .map(a => a.pincode)
      .filter(Boolean);
    return [...new Set(pins)];
  }, [deliveryAreas, formData.city]);

  /** Redirect if cart is empty */
  useEffect(() => {
    if (cart.length === 0) navigate("/cart");
  }, [cart, navigate]);

  /** Redirect if user is not logged in */
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  /** Load saved address from localStorage */
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem("savedAddress");
      if (savedAddress) setFormData(JSON.parse(savedAddress));
    } catch (error) {
      console.warn("Invalid saved address in localStorage", error);
    }
  }, []);

  /** Fetch delivery areas from backend */
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/delivery-areas");
        setDeliveryAreas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch delivery areas:", err);
        setDeliveryAreas([{ id: 1, city: "Haldwani", pincode: null, active: true }]);
      }
    };
    fetchAreas();
  }, []);

  /** Handle shipping address submit */
  const handleAddressSubmit = (e) => {
    e.preventDefault();

    const cityOk = activeCities
      .map(c => c.toLowerCase())
      .includes((formData.city || "").trim().toLowerCase());

    if (!cityOk) {
      alert(`We currently deliver only in: ${activeCities.join(", ") || "no cities"}`);
      return;
    }

    if (validPincodesForCity.length > 0) {
      if (!validPincodesForCity.includes(formData.pincode)) {
        alert(`We deliver to ${formData.city} only in these pincodes: ${validPincodesForCity.join(", ")}`);
        return;
      }
    }

    localStorage.setItem("savedAddress", JSON.stringify(formData));
    setEditing(false);
    setStep(2);
  };

  /** Handle payment and order creation */
  const handlePayment = async () => {
    setLoading(true);
    try {
      if (!token) {
        alert("Please login to place order.");
        navigate("/login");
        return;
      }

      if (cart.length === 0) {
        alert("Your cart is empty.");
        navigate("/cart");
        return;
      }

      const { data } = await axios.post(
        "http://localhost:5000/api/orders/create",
        {
          amount: getTotalPrice(),
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          phone: formData.phone,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpay_order_id } = data;

      if (!window.Razorpay) {
        alert("Payment gateway not loaded. Please refresh the page.");
        return;
      }

      const options = {
        key: "rzp_test_e3clyMYTBwCo5r",
        amount: getTotalPrice() * 100,
        currency: "INR",
        name: "Headphone Store",
        description: "Purchase Audio Products",
        order_id: razorpay_order_id,
        handler: async (response) => {
          try {
            await axios.post(
              "http://localhost:5000/api/orders/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            clearCart();
            alert("Order placed successfully!");
            navigate("/");
          } catch (err) {
            console.error("Payment verification failed:", err);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: formData.phone,
        },
        method: { upi: true, card: false, netbanking: false, wallet: false, emi: false },
        theme: { color: "#1A237E" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        <h1 className="checkout-title">Checkout</h1>
        
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className="step-item">
            <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>
              {step > 1 ? <Check className="step-icon" /> : '1'}
            </div>
            <span className="step-label">Shipping</span>
          </div>
          <div className="step-connector" />
          <div className="step-item">
            <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>
              {step > 2 ? <Check className="step-icon" /> : '2'}
            </div>
            <span className="step-label">Payment</span>
          </div>
        </div>

        {/* Address Step */}
        {step === 1 && (
          <div className="checkout-step">
            <div className="step-header">
              <MapPin className="step-header-icon" />
              <h2 className="step-title">Shipping Address</h2>
            </div>

            {!editing ? (
              <div className="address-display">
                {formData.address ? (
                  <div className="address-card">
                    <div className="address-info">
                      <div className="address-row">
                        <strong>Address:</strong> {formData.address}
                      </div>
                      <div className="address-row">
                        <strong>City:</strong> {formData.city}
                      </div>
                      <div className="address-row">
                        <strong>Pincode:</strong> {formData.pincode}
                      </div>
                      <div className="address-row">
                        <strong>Phone:</strong> {formData.phone}
                      </div>
                    </div>
                    <div className="address-actions">
                      <button
                        onClick={() => setEditing(true)}
                        className="btn btn-secondary"
                      >
                        <Edit3 className="btn-icon" />
                        Change Address
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="btn btn-primary"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-address">
                    <p>No address added yet</p>
                    <button
                      onClick={() => setEditing(true)}
                      className="btn btn-primary"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddressSubmit} className="address-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Address</label>
                    <input
                      type="text"
                      placeholder="Enter your complete address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <select
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                          pincode: ""
                        }))
                      }
                      className="form-select"
                      required
                    >
                      <option value="">Select City</option>
                      {activeCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      placeholder="Enter pincode"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, pincode: e.target.value }))
                      }
                      className="form-input"
                      required
                    />
                    {formData.city && validPincodesForCity.length > 0 && (
                      <p className="form-help">
                        Available pincodes for {formData.city}: {validPincodesForCity.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  Save & Continue
                </button>
              </form>
            )}
          </div>
        )}

        {/* Payment Step */}
        {step === 2 && (
          <div className="checkout-step">
            <div className="step-header">
              <CreditCard className="step-header-icon" />
              <h2 className="step-title">Payment Method</h2>
            </div>

            <div className="payment-section">
              <div className="payment-method">
                <div className="payment-method-header">
                  <Smartphone className="payment-icon" />
                  <div>
                    <h3 className="payment-title">UPI Payment</h3>
                    <p className="payment-subtitle">
                      Pay securely using any UPI app like GPay, PhonePe, Paytm, etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-summary">
                <h3 className="summary-title">Order Summary</h3>
                <div className="summary-items">
                  {cart.map((item) => (
                    <div key={item.id} className="summary-item">
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">x {item.quantity}</span>
                      </div>
                      <span className="item-price">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="summary-total">
                  <div className="total-row">
                    <span className="total-label">Total Amount</span>
                    <span className="total-amount">₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="btn btn-primary btn-full btn-payment"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="btn-icon" />
                    Pay ₹{getTotalPrice().toLocaleString()} with UPI
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
