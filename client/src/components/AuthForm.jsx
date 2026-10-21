// The form shared by LoginPage and SignupPage:
// username, password, a submit button, and an error message.
// Each page passes in its own title, button label, and what to do on submit (log in or sign up).
import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'

function AuthForm({ title, submitLabel, onSubmit, footer, isSignup = false }) {
    // What the user has typed so far:
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    // Flask error message (if any):
    const [error, setError] = useState('')

    // True while waiting for Flask (so button can't be clicked twice):
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()      // stop browser from re-loading page
        setError('')
        setSubmitting(true)
        try {
            await onSubmit(username, password)
            // on success: the page that owns the form moves user forward
        } catch (err) {
            setError(err.message)       // the message from apiFetch/Flask
            setSubmitting(false)
        }
    }

    return (
        // Full-height navy background with form centered on it
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
                <Typography variant="h3" color="primary">quietcart</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    your private shopping list for the people you love
                </Typography>

                <Typography variant="h5" sx={{ mb: 2 }}>{title}</Typography>

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        {/* Only shown when Flask returned an error */}
                        {error && <Alert severity="error">{error}</Alert>}

                        <TextField
                            label="Username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            autoComplete="username"
                            required
                        />
                        <TextField
                            label="Password"
                            type="password"   // hides the characters as they're typed
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            // Helps password managers: suggest a new password on signup, or
                            // fill in the saved one on login
                            autoComplete={isSignup ? 'new-password' : 'current-password'}
                            helperText={isSignup ? 'At least 8 characters' : ''}
                            required
                        />

                        <Button type="submit" variant="contained" size="large" disabled={submitting}>
                            {submitting ? 'Please wait...' : submitLabel}
                        </Button>
                    </Stack>
                </Box>

                {/* A link to the other page, e.g. "No account? Sign up" */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
            </Paper>
        </Box>
    )
}

export default AuthForm