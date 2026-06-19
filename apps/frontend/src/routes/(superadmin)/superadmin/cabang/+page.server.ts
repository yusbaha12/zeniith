import type { PageServerLoad } from './$types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const load: PageServerLoad = async ({ fetch, request }) => {
  const cookieHeader = request.headers.get('cookie')
  const res = await fetch(`${API_BASE_URL}/superadmin/branches`, {
    headers: {
      cookie: cookieHeader || ''
    }
  })

  if (!res.ok) {
    return { branches: [] }
  }

  const result = await res.json()
  return { branches: result.data }
}
