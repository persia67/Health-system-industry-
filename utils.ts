export const toJalali = (dateStr: string): string => {
  const d = new Date(dateStr);
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + parseInt(String((gy2 + 3) / 4)) - parseInt(String((gy2 + 99) / 100)) + parseInt(String((gy2 + 399) / 400)) - 80 + gd + gdm[gm - 1];
  let jy2 = -1595 + (33 * parseInt(String(days / 12053)));
  days %= 12053;
  jy2 += 4 * parseInt(String(days / 1461));
  days %= 1461;
  if (days > 365) {
    jy2 += parseInt(String((days - 1) / 365));
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + parseInt(String(days / 31)) : 7 + parseInt(String((days - 186) / 30));
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  return `${jd} ${monthNames[jm - 1]} ${jy2 + jy}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};