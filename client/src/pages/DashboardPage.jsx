// The homepage: loads everything from GET /api/dashboard in one request.

import { useEffect, useState } from 'react'
import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material'

import { apiFetch } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatMoney } from '../utils/format.js'
import RecipientSummary from '../components/RecipientSummary.jsx'

function DashboardPage() {
    const { user } = useAuth()

    // The dashboard data from Flask : { recipients, totals, recent_ideas }
    // null = "not loaded yet"
    const [dashboard, setDashboard] = useState(null)
    const [error, setError] = useState('')

    // Load the dashboard one time, when the page opens
    useEffect(() => {
        apiFetch('/dashboard')
            .then((data) => setDashboard(data))
            .catch((err) => setError(error.message))
    }, [])

    // 1. AN ERROR OCCURS - show Flask/apiFetch message:
    if (error) {
        return <Alert severity='error'>{error}</Alert>
    }

    // 2. LOADING...
    if (dashboard === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    // 3. LOADED - show the page:
    const { totals, recipients } = dashboard

    // FOUR SUMMARY CARDS - as data, so the JSX below can loop over them
    const stats = [
        { label: 'Recipients', value: totals.recipients },
        { label: 'Ideas to buy', value: totals.ideas },
        { label: 'Total budget', value: formatMoney(totals.budget) },
        { label: 'Spent', value: formatMoney(totals.spent) },
    ]

    return (
        <Box>
            <Typography variant="h3" color="primary">Welcome back, {user.username}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Here's what's on everyone's list.
            </Typography>

            {/* AT A GLANCE: 2 columns on phones, 4 on wider screens */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 2,
                    mb: 4,
                }}
            >
                {stats.map((stat) => (
                    <Paper key={stat.label} sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                        <Typography variant="h4" color="primary">{stat.value}</Typography>
                    </Paper>
                ))}
            </Box>
            {/* YOUR RECIPIENTS' LISTS: 1 column on phones, 2 on tablets, 3 on wide screens */}
            <Typography variant="h5" sx={{ mb: 2 }}>Your recipients' lists</Typography>

            {recipients.length === 0 ? (
                <Typography color="text.secondary">
                    No recipients yet. Add the people you shop for from the Recipients page.
                </Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                        gap: 2,
                        mb: 4,
                    }}
                >
                    {recipients.map((recipient) => (
                        <RecipientSummary key={recipient.id} recipient={recipient} />
                    ))}
                </Box>
            )}
        </Box>
    )
}

export default DashboardPage