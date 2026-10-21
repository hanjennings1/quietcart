// TEMPORARY: proves the React → Vite proxy → Flask connection works.
// Replaced Thursday with the real app (routing, login, pages).
import { useEffect, useState } from 'react'

function App() {
  // What Flask answered, shown on the page
  const [result, setResult] = useState('Checking the connection...')

  // useEffect with an empty [] runs once, when the page first loads
  useEffect(() => {
    // A relative URL: "/api/..." goes to Vite, which forwards it to Flask
    fetch('/api/check_session')
      .then((response) => response.json())
      .then((data) => setResult(JSON.stringify(data)))
      .catch(() => setResult('Could not reach the server. Is Flask running?'))
  }, [])

  return (
    <main>
      <h1>quietcart</h1>
      <p>Flask says: {result}</p>
    </main>
  )
}

export default App