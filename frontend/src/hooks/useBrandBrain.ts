import { supabase } from '../lib/supabase'
import type { BrandBrain } from '../types'

export type BrandBrainInput = Omit<BrandBrain, 'id'>

export async function saveBrandBrain(data: BrandBrainInput) {
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

  return supabase.from('brand_brain').upsert({
    ...data,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  })
}

export async function getBrandBrain(): Promise<BrandBrain | null> {
  const { data, error } = await supabase
    .from('brand_brain')
    .select('*')
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
