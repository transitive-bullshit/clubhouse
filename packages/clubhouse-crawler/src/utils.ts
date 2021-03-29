export function sanitize(str: string): string {
  return (str || '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/['"]/g, '')
    .replace(/[\\]/g, '-')
    .trim()
}
