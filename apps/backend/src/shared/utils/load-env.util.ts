/*
Tujuan: Memuat file `.env` workspace secara otomatis untuk runtime backend lokal tanpa export manual.
Caller: Config service backend saat bootstrap dev/build dijalankan dari root maupun package backend.
Dependensi: Node fs/path dan process.env runtime Bun.
Main Functions: Menemukan `.env` terdekat dari current working directory, parse pasangan KEY=VALUE sederhana, lalu mengisi env yang belum ada.
Side Effects: Mengubah `process.env` di runtime backend sebelum config dipakai.
*/

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

let hasLoadedWorkspaceEnv = false

const stripWrappingQuote = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

const findWorkspaceEnvPath = (startDir: string): string | null => {
  let currentDir = startDir

  while (true) {
    const envPath = join(currentDir, '.env')

    if (existsSync(envPath)) {
      return envPath
    }

    const parentDir = dirname(currentDir)

    if (parentDir === currentDir) {
      return null
    }

    currentDir = parentDir
  }
}

export const loadWorkspaceEnv = (): void => {
  if (hasLoadedWorkspaceEnv) {
    return
  }

  const envPath = findWorkspaceEnvPath(process.cwd())

  if (!envPath) {
    hasLoadedWorkspaceEnv = true
    return
  }

  const content = readFileSync(envPath, 'utf8')

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = stripWrappingQuote(line.slice(separatorIndex + 1).trim())

    if (!key || process.env[key] !== undefined) {
      continue
    }

    process.env[key] = value
  }

  hasLoadedWorkspaceEnv = true
}
