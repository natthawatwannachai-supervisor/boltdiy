import { HttpError } from './http.ts';

/**
 * โมเดลบางครั้งห่อ JSON ด้วย markdown code fence หรือมีข้อความนำ
 * ฟังก์ชันนี้ดึงเฉพาะส่วน JSON ออกมาให้ก่อน parse
 */
export const parseJsonResponse = <T>(raw: string): T => {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        // ตกไปที่ error ด้านล่าง
      }
    }

    throw new HttpError('AI_PROVIDER_ERROR', 'ผลลัพธ์จาก AI อยู่ในรูปแบบที่อ่านไม่ได้ กรุณาลองอีกครั้ง');
  }
};
