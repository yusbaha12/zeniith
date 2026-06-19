/*
Tujuan: Menyediakan logger JSON terstruktur sederhana untuk bootstrap dan observabilitas awal backend.
Caller: index.ts, container, repository, dan service backend.
Dependensi: Runtime Date dan console bawaan.
Main Functions: Menulis log info, warn, dan error dalam format JSON yang stabil.
Side Effects: Menulis log ke stdout/stderr.
*/

type LogLevel = 'info' | 'warn' | 'error'

const writeLog = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  }

  const output = JSON.stringify(payload)

  if (level === 'error') {
    console.error(output)
    return
  }

  console.log(output)
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => writeLog('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => writeLog('error', message, context)
}
