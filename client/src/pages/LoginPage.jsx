// The /login page:
// the shared AuthForm, set up for logging in

import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Link, Typography } from '@mui/material'

import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()      // lets code change the page

    async function handleLogin(username, password) {
        // If login fails: it throws & AuthForm shows the error
        // If succeeds:
        await login(username, password)
        navigate('/')       // goes to dashboard
    }

    return (
        <AuthForm
            title="Log in"
            submitLabel="Log in"
            onSubmit={handleLogin}
            footer={
                <Typography variant="body2">
                    New to quietcart?{' '}
                    {/* An MUI-styled link that uses React Router to change pages */}
                    <Link component={RouterLink} to="/signup">Create an account</Link>
                </Typography>
            }
        />
    )
}

export default LoginPage
