import Link from "next/link"

export default function Footer() {
    return (
    <footer className="relative z-20 bg-gradient-to-r from-[#AFD5F0] via-[#A3C6E0] to-[#7C9FB9] backdrop-blur-lg border-t border-purple-500/10 pb-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna 1 - Logo e información */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center mb-4">
                <img src="/logo_transparent.png" alt="Logo" className="h-8 w-8 mr-2" />
                <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-cyan-400">
                  Celestis
                </span>
              </div>
              <p className="text-sm text-white text-center md:text-left">
                A student-led CanSat project developed for the European Space Agency competition. Exploring the atmosphere, one data point at a time.
              </p>
            </div>
            
            {/* Columna 2 - Enlaces rápidos */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-medium text-white mb-4">Quick Links</h3>
              <div className="flex flex-col space-y-2">
                <Link href="/data" className="text-slate-100 hover:text-cyan-300 transition-colors">
                  Live Data
                </Link>
                <Link href="#team" className="text-slate-100 hover:text-cyan-300 transition-colors">
                  Our Team
                </Link>
              </div>
            </div>
            
            {/* Columna 3 - Contacto */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-medium text-white mb-4">Contact Us</h3>
              <div className="flex flex-col space-y-2">
                <a href="mailto:celestis@celestis.sat" className="text-white hover:text-cyan-300 transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                  </svg>
                  contact@celestis.sat
                </a>
                <div className="flex space-x-4 mt-2">
                  <a href="https://github.com/ImJustMario" className="text-white hover:text-cyan-300 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z"></path>
                    </svg>
                  </a>
                  <a href="https://instagram.com/celestis.sat" className="text-white hover:text-cyan-300 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center mt-8 text-sm text-white">
            <p>© {new Date().getFullYear()} Celestis. All rights reserved.</p>
          </div>
        </div>
        </footer>
    )
}