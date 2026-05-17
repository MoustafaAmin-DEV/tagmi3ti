/** رابط واتساب لمتجر مصري (رقم بصيغة دولية 20…) */
export function buildWhatsAppUrl(phone: string, message: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '20' + digits.slice(1);
  } else if (!digits.startsWith('20')) {
    digits = '20' + digits;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function partInquiryMessage(partName: string, storeName?: string): string {
  const prefix = storeName ? `مرحباً ${storeName}، ` : 'مرحباً، ';
  return `${prefix}أستفسر عن توفر وسعر: ${partName}`;
}
