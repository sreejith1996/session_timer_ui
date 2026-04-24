import './index.css'
import { useState, useEffect, type FormEvent, type ChangeEvent, type JSX } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

type Claims = {
  email?: string
  [key: string]: any
} | null

const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
)

export default function App(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [claims, setClaims] = useState<Claims>(null)

  const params = new URLSearchParams(window.location.search)
  const hasTokenHash = params.get('token_hash')

  const [verifying, setVerifying] = useState<boolean>(!!hasTokenHash)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<boolean>(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token_hash = params.get('token_hash')
    const type = params.get('type')

    if (token_hash) {
      supabase.auth
        .verifyOtp({
          token_hash,
          type: (type as any) || 'email',
        })
        .then(({ error }) => {
          if (error) {
            setAuthError(error.message)
          } else {
            setAuthSuccess(true)
            window.history.replaceState({}, document.title, '/')
          }
          setVerifying(false)
        })
    }

    supabase.auth.getClaims().then(({ data }) => {
      setClaims(data?.claims ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getClaims().then(({ data }) => {
        setClaims(data?.claims ?? null)
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
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
    setClaims(null)
  }

  if (verifying) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>Confirming your magic link...</p>
        <p>Loading...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>✗ Authentication failed</p>
        <p>{authError}</p>
        <button
          onClick={() => {
            setAuthError(null)
            window.history.replaceState({}, document.title, '/')
          }}
        >
          Return to login
        </button>
      </div>
    )
  }

  if (authSuccess && !claims) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>✓ Authentication successful!</p>
        <p>Loading your account...</p>
      </div>
    )
  }

  const callBackend = async () => {
    // Get the current session to extract the access token
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      alert('Not logged in')
      return
    }

    const response = await fetch('http://localhost:9000/api/protected', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log(data)
  }

  if (claims) {
    return (
      <div>
        <h1>Welcome!</h1>
        <p>You are logged in as: {claims.email}</p>
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
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
        />
        <button disabled={loading}>
          {loading ? <span>Loading</span> : <span>Send magic link</span>}
        </button>
      </form>
    </div>
  )
}