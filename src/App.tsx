import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import { AppProvider } from './context/AppContext'
import { AppV5Provider } from './context/AppV5Context'
import { AuthProvider } from './context/AuthContext'

export function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <AppV5Provider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </AppV5Provider>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
