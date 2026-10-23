// The /interests/:id page: everyone who shares one interest chip.
// Answers "who else likes this?", so one great find can become a gift for the right person.

import { useEffect, useState } from 'react'
import { Link as RouterLink, useOutletContext, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Link, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { apiFetch } from '../api.js'
import RecipientCard from '../components/RecipientCard.jsx'

function InterestPage() {
    const { id } = useParams()

    // Reload after a quick-add
    const { dataVersion } = useOutletContext()

    // The chip and its recipients (from Flask); null = not yet loaded
    const [interest, setInterest] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        apiFetch(`/interests/${id}`)
            .then((data) => setInterest(data))
            .catch((err) => setError(err.message))
    }, [id, dataVersion])

    // 1. NOT FOUND (or another error)
    if (error) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Link component={RouterLink} to="/recipients">Back to recipients</Link>
            </Box>
        )
    }

    // 2. STILL LOADING...
    if (interest === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    // 3. LOADED
    const count = interest.recipients.length

    return (
        <Box>
            <Button component={RouterLink} to="/recipients" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                Recipients
            </Button>

            <Typography variant="h3" color="primary">{interest.label}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                {count} {count === 1 ? 'person likes' : 'people like'} this
            </Typography>

            {/* Same cards as the Recipients page; each links to that person */}
            <Box
                sx={{
                    display: 'grid',
                    // same columns as the Recipients page: 1 on phones, 2 on tablets, 3 on wide screens
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                    gap: 2,
                }}
            >
                {interest.recipients.map((recipient) => (
                    <RecipientCard key={recipient.id} recipient={recipient} />
                ))}
            </Box>
        </Box>
    )
}

export default InterestPage