import { supabase } from '../lib/supabase'
import type { BrandBrain } from '../types'

export type BrandBrainInput = Omit<BrandBrain, 'id'>

async function getCurrentUserId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('No authenticated user found')
  }

  return user.id
}

export async function saveBrandBrain(data: BrandBrainInput) {
  const userId = await getCurrentUserId()
  const payload = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  const { data: existing, error: existingError } = await supabase
    .from('brand_brain')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return supabase
      .from('brand_brain')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single()
  }

  return supabase
    .from('brand_brain')
    .insert({
      ...payload,
      user_id: userId,
    })
    .select('id')
    .single()
}

export async function getBrandBrain(): Promise<BrandBrain | null> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('brand_brain')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function hasBrandBrain(): Promise<boolean> {
  const brandBrain = await getBrandBrain()
  return brandBrain !== null
}
