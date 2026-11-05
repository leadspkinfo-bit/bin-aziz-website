/** "0300-1234567", "+92 300 1234567" or "923001234567" → "923001234567"; null when it can't be a phone number. */
export function whatsappNumber(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`; // local Pakistani number
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}
