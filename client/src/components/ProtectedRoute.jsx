// Guards private pages: only logged-in users allowed
// Used in App.jsx as a "layout route" wrapped around the private pages

// Note: this is for a smooth user experience only;
// real security lives in Flask, which rejects every private request w/o a valid session
import { Navigate, Outlet } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute() {
    const { user, checkingSession } = useAuth()

    // Waiting for Flask to answer "WHO IS LOGGED IN"
    if (checkingSession) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        )
    }

    // NOT LOGGED IN: sent to login page
    if (!user) {
        return <Navigate to='/login' replace />     // replace swaps out History entry/can't hit back button to this page
    }

    // LOGGED IN:
    return <Outlet />       // shows whichever private page matches
}

export default ProtectedRoute

