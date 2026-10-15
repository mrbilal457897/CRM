export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const text = String(value)
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ]
  return lines.join('\r\n')
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToCsv(filename: string, rows: Array<Record<string, unknown>>): void {
  downloadFile(filename, toCsv(rows))
}

export function exportToJson(filename: string, data: unknown): void {
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json')
}
