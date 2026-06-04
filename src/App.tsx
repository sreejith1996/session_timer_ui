import { useEffect, useState, type JSX } from 'react'
import { Outlet } from 'react-router'
import type { User } from '@supabase/supabase-js'

import { supabase } from './lib/supabase'

export type AppOutletContext = {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  authReady: boolean
}

export default function App(): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState<boolean>(false)

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user ?? null)
      setAuthReady(true)
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <Outlet context={{ user, setUser, authReady }} />
}
