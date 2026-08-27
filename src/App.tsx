import { Routes, Route } from 'react-router'
import { UnitProvider } from '@/hooks/useUnits'
import { ToastProvider } from '@/components/Toast'
import Home from './pages/Home'
import Measure from './pages/Measure'
import Ruler from './pages/Ruler'
import History from './pages/History'

export default function App() {
  return (
    <UnitProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/measure" element={<Measure />} />
          <Route path="/ruler" element={<Ruler />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </ToastProvider>
    </UnitProvider>
  )
}
