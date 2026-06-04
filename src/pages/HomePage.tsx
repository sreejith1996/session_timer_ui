import { type ChangeEvent, type FormEvent, type JSX, useState } from 'react'
import { useOutletContext } from 'react-router'

import { supabase } from '../lib/supabase'
import type { AppOutletContext } from '../App'

export default function HomePage(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const { user, setUser, authReady } = useOutletContext<AppOutletContext>()

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for the login link!')
    }

    setLoading(false)
  }

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const callBackend = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert('Not logged in')
      return
    }

    const response = await fetch('http://localhost:9000/api/protected', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      alert('Protected backend request failed.')
      return
    }
  }

  if (!authReady) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>Loading your account...</p>
      </div>
    )
  }

  if (user) {
    return (
      <div>
        <h1>Welcome!</h1>
        <p>You are logged in as: {user.email}</p>
        <button onClick={callBackend}>Call Protected Backend Route</button>
        <button onClick={handleLogout}>Sign Out</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Supabase + React</h1>
      <p>Sign in via magic link with your email below</p>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          required
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
        <button disabled={loading}>
          {loading ? <span>Loading</span> : <span>Send magic link</span>}
        </button>
      </form>
    </div>
  )
}
