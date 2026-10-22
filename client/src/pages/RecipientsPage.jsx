// The recipients' page: every recipient has a card, plus a button to add a recipient

import { useEffect, useState } from 'react'
import { Link as RouterLink, useOutletContext } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

import { apiFetch } from '../api.js'
import RecipientCard from '../components/RecipientCard.jsx'

function RecipientsPage() {

    // Goes up after every quick-add; reloading on change keeps idea counts current
    const { dataVersion } = useOutletContext()

    // The list from Flask: null = 'not loaded yet'
    const [recipients, setRecipients] = useState(null)
    const [error, setError] = useState('')

    // Load the recipients when the page opens and again after a quick-add
    useEffect(() => {
        apiFetch('/recipients')
            .then((data) => setRecipients(data))
            .catch((err) => setError(err.message))
    }, [dataVersion])

    // 1. SOMETHING WENT WRONG:
    if (error) {
        return <Alert severity='error'>{error}</Alert>
    }

    // 2. STILL LOADING...
    if (recipients === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    // 3. LOADED
    return (
        <Box>
            {/* HEADER: title on the left, Add button on the right
          (stacks on narrow screens thanks to flexWrap) */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h3" color="primary">Recipients</Typography>
                    <Typography color="text.secondary">The people you shop for.</Typography>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"   // gold: a page accent
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/recipients/new"
                >
                    Add recipient
                </Button>
            </Box>

            {recipients.length === 0 ? (
                <Typography color="text.secondary">
                    No recipients yet. Add the first person you shop for!
                </Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                        gap: 2,
                    }}
                >
                    {recipients.map((recipient) => (
                        <RecipientCard key={recipient.id} recipient={recipient} />
                    ))}
                </Box>
            )}
        </Box>
    )
}

export default RecipientsPage