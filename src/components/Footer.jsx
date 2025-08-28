import React from 'react'
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-200 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          
          {/* Logo & Description */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Headphone Store</h2>
            <p className="text-gray-400 max-w-xs">
              Your one-stop shop for all things tech and lifestyle. Fast delivery and secure payments.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li><a href="/" className="hover:text-emerald-500 transition">Home</a></li>
              <li><a href="/shop" className="hover:text-emerald-500 transition">Shop</a></li>
              <li><a href="/about" className="hover:text-emerald-500 transition">About Us</a></li>
              <li><a href="/contact" className="hover:text-emerald-500 transition">Contact</a></li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-2">Follow Us</h3>
            <div className="flex gap-4 justify-center md:justify-start">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-6 w-6 hover:text-emerald-500 transition" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-6 w-6 hover:text-emerald-500 transition" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-6 w-6 hover:text-emerald-500 transition" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-6 w-6 hover:text-emerald-500 transition" />
              </a>
            </div>
          </div>
        </div>

        <hr className="my-6 border-gray-700" />

        <p className="text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} ShopEase. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
