import { supabase } from './supabase'
import type { UserRole, Profile } from './types'

// Register new user with role
export async function signUp(
  email: string, 
  password: string, 
  role: UserRole,
  fullName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName }
    }
  })
  if (error) throw error
  return data
}

// Sign in
export async function signIn(
  email: string, 
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  })
  if (error) throw error
  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current user profile with role
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// Route guard helper
export function getPortalRoute(role: UserRole): string {
  switch (role) {
    case 'community_member': return '/client'
    case 'organization': return '/cbo'
    case 'admin': return '/admin'
    default: return '/login'
  }
}
