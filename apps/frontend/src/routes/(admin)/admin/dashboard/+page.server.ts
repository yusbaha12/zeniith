import type { PageServerLoad } from './$types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const load: PageServerLoad = async ({ fetch, request }) => {
  const cookieHeader = request.headers.get('cookie')
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: {
      cookie: cookieHeader || ''
    }
  })

  if (!res.ok) {
    return { stats: { avgScore: 0, activeStudents: 0 } }
  }

  const result = await res.json()
  return { stats: result.data }
}
