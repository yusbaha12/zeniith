import type { PageServerLoad } from './$types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const load: PageServerLoad = async ({ fetch, request, url }) => {
  const cookieHeader = request.headers.get('cookie')
  const searchQuery = url.searchParams.get('q') ?? ''
  const page = url.searchParams.get('page') ?? '1'
  const limit = url.searchParams.get('limit') ?? '10'

  const res = await fetch(
    `${API_BASE_URL}/admin/students?searchQuery=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`,
    {
      headers: {
        cookie: cookieHeader || ''
      }
    }
  )

  if (!res.ok) {
    return {
      students: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
    }
  }

  const result = await res.json()
  return { students: result.data }
}
