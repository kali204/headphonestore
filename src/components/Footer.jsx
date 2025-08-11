const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6"> {/* Reduced vertical padding */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Reduced gap */}
          <div>
            <h3 className="text-lg font-bold text-sony mb-2">Sony Audio</h3> {/* Smaller heading & margin */}
            <p className="text-gray-400 text-sm">Premium audio products with industry-leading sound quality.</p> {/* Smaller text */}
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 text-sm">Quick Links</h4> {/* Smaller heading */}
            <div className="space-y-1">
              <a href="/products" className="block text-gray-400 hover:text-white text-sm">Products</a> {/* Smaller text */}
              <a href="/support" className="block text-gray-400 hover:text-white text-sm">Support</a>
              <a href="/warranty" className="block text-gray-400 hover:text-white text-sm">Warranty</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 text-sm">Contact</h4> {/* Smaller heading */}
            <div className="space-y-1 text-gray-400 text-sm"> {/* Smaller spacing and text */}
              <p>Email: support@sonyaudio.com</p>
              <p>Phone: +91 98371 10330</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-4 text-center text-gray-400 text-xs"> {/* Reduced margin, padding and smaller text */}
          <p>&copy; 2024 Sony Audio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
