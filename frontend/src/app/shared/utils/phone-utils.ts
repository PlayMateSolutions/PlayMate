export function normalizePhoneNumber(phoneNumber: string, countryCode: string = '+91'): string {
    if (!phoneNumber) return '';
    // Remove all non-digit characters
    let normalized = phoneNumber.replace(/\D/g, '');

    const countryDigits = countryCode.replace('+', '');
    if (!normalized.startsWith(countryDigits)) {
        normalized = countryDigits + normalized;
    }
    return normalized;
}