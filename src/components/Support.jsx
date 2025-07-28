const Support = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Support</h1>
      
      <p className="text-gray-700 text-center mb-10">
        Need help? Fill out the form below, and we’ll get back to you soon.
      </p>

      {/* Contact Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-10">
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Your Email"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Message</label>
            <textarea
              placeholder="Your Message"
              rows="4"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-blue-300"
            ></textarea>
          </div>
          <button
            type="button"
            onClick={() => alert('Message submitted! (No backend connected)')}
            className="bg-sony text-white px-4 py-2 rounded-lg hover:bg-sonyLight"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">How can I track my order?</h3>
            <p className="text-gray-600">You can track your order in the "My Orders" section of your account.</p>
          </div>
          <div>
            <h3 className="font-semibold">What is the return policy?</h3>
            <p className="text-gray-600">You can return products within 7 days of delivery.</p>
          </div>
          <div>
            <h3 className="font-semibold">How can I contact support?</h3>
            <p className="text-gray-600">Use the contact form above or email us at support@example.com.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
