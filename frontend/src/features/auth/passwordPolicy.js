export function getPasswordChecks(password) {
  return {
    length: password.length >= 8 && password.length <= 72,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9\s]/.test(password),
  }
}

export function isStrongPassword(password) {
  return Object.values(getPasswordChecks(password)).every(Boolean)
}
