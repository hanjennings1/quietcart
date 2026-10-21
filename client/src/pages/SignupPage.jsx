// The /signup page
// the shared AuthForm, set up for creating an account

import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Link, Typography } from '@mui/material'

import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function SignupPage() {
    const { signup } = useAuth()
    const navigate = useNavigate()

    async function handleSignup(username, password) {
        // If signup fails: it throws & AuthForm shows Flask message
        // Signing up also logs user in -> go straight to dashboard
        await signup(username, password)
        navigate('/')
    }

    return (
        <AuthForm
            title="Create an account"
            submitLabel="Sign up"
            onSubmit={handleSignup}
            isSignup
            footer={
                <Typography variant="body2">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login">Log in</Link>
                </Typography>
            }
        />
    )
}

export default SignupPage
