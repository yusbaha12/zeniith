/*
Tujuan: Menyediakan store auth frontend fase 1 untuk login, register, logout, dan sinkron profil.
Caller: Halaman login/daftar, shell role, dan halaman profil.
Dependensi: Auth API dan tipe auth/user frontend.
Main Functions: Menyimpan user aktif, status loading, error terakhir, dan helper auth action.
Side Effects: Melakukan HTTP call auth dan mengubah state auth di browser.
*/

import type { LoginInput, RegisterInput } from '$lib/domain/types/auth.types'
import type { FrontendUser } from '$lib/domain/types/user.types'
import { authApi } from '$lib/infrastructure/api/auth.api'

class AuthStore {
  user = $state<FrontendUser | null>(null)
  isLoading = $state(false)
  error = $state<string | null>(null)

  isAuthenticated = $derived(this.user !== null)

  hydrate(user: FrontendUser | null) {
    this.user = user
  }

  async login(input: LoginInput) {
    this.isLoading = true
    this.error = null

    try {
      const result = await authApi.login(input)
      this.user = result.user
      return result
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Login gagal'
      throw error
    } finally {
      this.isLoading = false
    }
  }

  async register(input: RegisterInput) {
    this.isLoading = true
    this.error = null

    try {
      return await authApi.register(input)
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Pendaftaran gagal'
      throw error
    } finally {
      this.isLoading = false
    }
  }

  async fetchMe() {
    try {
      const user = await authApi.me()
      this.user = user
      return user
    } catch {
      this.user = null
      return null
    }
  }

  async logout() {
    await authApi.logout()
    this.user = null
  }
}

export const authStore = new AuthStore()
