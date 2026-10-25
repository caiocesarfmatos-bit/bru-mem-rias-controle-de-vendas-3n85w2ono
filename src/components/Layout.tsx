import React from 'react'
import { Outlet } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { Header } from './Header'
import { Footer } from './Footer'

export default function Layout() {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-[#1E1E1E] font-sans antialiased selection:bg-[#FF1493]/20 selection:text-[#FF1493]">
        <Header />
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AppProvider>
  )
}
