const  Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-sony mb-4">Sony Audio</h3>
            <p className="text-gray-400">Premium audio products with industry-leading sound quality.</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              <a href="/products" className="block text-gray-400 hover:text-white">Products</a>
              <a href="/support" className="block text-gray-400 hover:text-white">Support</a>
              <a href="/warranty" className="block text-gray-400 hover:text-white">Warranty</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-gray-400">
              <p>Email: support@sonyaudio.com</p>
              <p>Phone: +91 98371 10330</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Sony Audio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
 