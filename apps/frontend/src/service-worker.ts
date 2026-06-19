/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker'

const CACHE_NAME = `lms-cache-v${version}`

// Menggabungkan aset hasil compile Vite dan aset di folder static
const ASSETS = [
  ...build,
  ...files
]

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS)
    }).then(() => {
      return (self as any).skipWaiting()
    })
  )
})

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => {
      return (self as any).clients.claim()
    })
  )
})

self.addEventListener('fetch', (event: any) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  // Caching hanya untuk aset statis dan API materi belajar / file storage yang diakses murid
  const isStaticAsset = ASSETS.includes(url.pathname) || url.pathname.startsWith('/_app/')
  const isMaterialAsset = url.pathname.includes('/api/materials') || url.pathname.includes('/storage')

  if (isStaticAsset || isMaterialAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Mengembalikan dari cache jika ada
            return cachedResponse
          }

          // Jika tidak ada di cache, ambil dari network dan simpan ke cache
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              void cache.put(event.request, networkResponse.clone())
            }
            return networkResponse
          }).catch(() => {
            // Fallback sederhana jika offline total dan tidak ada di cache
            return new Response('Konten tidak tersedia secara offline', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
        })
      })
    )
  }
})
