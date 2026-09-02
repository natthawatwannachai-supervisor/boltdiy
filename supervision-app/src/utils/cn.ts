/** Tiny classnames helper — keeps conditional Tailwind lists readable. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
