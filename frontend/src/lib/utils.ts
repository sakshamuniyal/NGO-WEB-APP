import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Uppercase display for avatar initials. */
function formatInitialsDisplay(raw: string): string {
  const t = raw.trim().toUpperCase()
  return t
}

/**
 * Two-letter initials (e.g. John Doe → JD). Falls back to a single full name,
 * then the local part of an email, then "?".
 */
export function getInitialsFromName(
  firstName?: string | null,
  lastName?: string | null,
  fullNameFallback?: string | null,
  emailFallback?: string | null,
): string {
  const f = firstName?.trim() ?? ""
  const l = lastName?.trim() ?? ""
  if (f && l) {
    return formatInitialsDisplay(f[0] + l[0])
  }
  if (f.length >= 2) {
    return formatInitialsDisplay(f.slice(0, 2))
  }
  if (f.length === 1) {
    return formatInitialsDisplay(f)
  }
  const full = fullNameFallback?.trim() ?? ""
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return formatInitialsDisplay(parts[0][0] + parts[parts.length - 1][0])
    }
    if (parts[0].length >= 2) {
      return formatInitialsDisplay(parts[0].slice(0, 2))
    }
    if (parts[0].length === 1) {
      return formatInitialsDisplay(parts[0])
    }
  }
  const email = emailFallback?.trim() ?? ""
  if (email.includes("@")) {
    const local = email.split("@")[0] ?? ""
    const letters = local.replace(/[^a-zA-Z]/g, "")
    if (letters.length >= 2) {
      return formatInitialsDisplay(letters.slice(0, 2))
    }
    if (letters.length === 1) {
      return formatInitialsDisplay(letters)
    }
    if (local.length >= 2) {
      return formatInitialsDisplay(local.slice(0, 2))
    }
    if (local.length === 1) {
      return formatInitialsDisplay(local)
    }
  }
  return "?"
}
