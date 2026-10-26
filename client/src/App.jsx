// The app's map: which page shows at which address.
import { Route, Routes } from 'react-router-dom'

import AppLayout from './components/AppLayout.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import InterestPage from './pages/InterestPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RecipientsPage from './pages/RecipientsPage.jsx'
import RecipientDetailPage from './pages/RecipientDetailPage.jsx'
import RecipientFormPage from './pages/RecipientFormPage.jsx'
import SignupPage from './pages/SignupPage.jsx'


function App() {
  return (
    // Routes shows the FIRST Route whose path matches the address bar
    <Routes>
      {/* Guest pages: only for logged-out users */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Private pages: ProtectedRoute checks login first, then AppLayout
          draws the sidebar, then the matching page appears inside it */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/recipients" element={<RecipientsPage />} />
          <Route path="/recipients/new" element={<RecipientFormPage />} />
          <Route path="/recipients/:id" element={<RecipientDetailPage />} />
          <Route path="/recipients/:id/edit" element={<RecipientFormPage />} />
          <Route path="/interests/:id" element={<InterestPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          {/* "*" matches any address no other route matched */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
