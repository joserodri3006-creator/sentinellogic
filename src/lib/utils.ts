/**
 * Utility functions for common formatting tasks
 */

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format date to readable format (DE locale)
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Format date to short format (e.g., "10. Jan")
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Format date to ISO format (e.g., "2026-01-10")
 */
export function formatDateISO(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch {
    return dateString
  }
}
