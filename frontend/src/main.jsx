import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Updated relative paths matching your sidebar structure
import Login_register from './components/Login-register/login_register'
import ProtectedRoute from './components/protectedRoute'
import AppLayout from './components/AppLayout'

// Temporary view placeholders for testing
const Dashboard = () => <div>Dashboard View</div>;
const Contacts = () => <div>Contacts View</div>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login_register />} />

        {/* Protected Navigation Shell Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)