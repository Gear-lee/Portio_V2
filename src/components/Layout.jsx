import Header from './Header'
import Navbar from './Navbar'

function Layout({ children, showNavbar = true }) {
  return (
    <div className="bg-[#0b071e] min-h-screen text-white">
      <Header />
      <main className="pb-24">
        {children}
      </main>
      {showNavbar && <Navbar />}
    </div>
  )
}

export default Layout
