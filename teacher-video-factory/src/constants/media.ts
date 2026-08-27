import type {
  AspectRatio,
  MusicMood,
  Resolution,
  SubtitleStyle,
  VoiceGender,
  VoiceTone,
} from '@/types/domain';
import type { Option } from './lesson';

export interface VoicePreset {
  id: string;
  label: string;
  gender: VoiceGender;
  tone: VoiceTone;
  description: string;
  /** ต้องใช้แพ็กเกจ Pro ขึ้นไป */
  premium: boolean;
}

/**
 * รายการเสียงเป็นค่ากลางของแอป — Edge Function จะ map ไปเป็น voice id
 * ของผู้ให้บริการ TTS จริง (Google / OpenAI / อื่น ๆ) อีกชั้นหนึ่ง
 */
export const VOICES: VoicePreset[] = [
  { id: 'th-male-teacher', label: 'ครูชาย มืออาชีพ', gender: 'male', tone: 'professional', description: 'น้ำเสียงชัดเจน เหมาะกับบทเรียนทั่วไป', premium: false },
  { id: 'th-male-warm', label: 'ครูชาย อบอุ่น', gender: 'male', tone: 'warm', description: 'นุ่มนวล เป็นกันเอง', premium: false },
  { id: 'th-male-playful', label: 'ครูชาย สนุกสนาน', gender: 'male', tone: 'playful', description: 'สดใส เหมาะกับชั้นประถม', premium: false },
  { id: 'th-male-serious', label: 'ครูชาย จริงจัง', gender: 'male', tone: 'serious', description: 'หนักแน่น เหมาะกับติวสอบ', premium: true },
  { id: 'th-male-doc', label: 'ผู้บรรยายสารคดี (ชาย)', gender: 'male', tone: 'documentary', description: 'ทุ้มลึก เหมาะกับสารคดี', premium: true },
  { id: 'th-female-teacher', label: 'ครูหญิง มืออาชีพ', gender: 'female', tone: 'professional', description: 'ชัดถ้อยชัดคำ เป็นทางการ', premium: false },
  { id: 'th-female-warm', label: 'ครูหญิง อบอุ่น', gender: 'female', tone: 'warm', description: 'อ่อนโยน เหมาะกับอนุบาล–ประถมต้น', premium: false },
  { id: 'th-female-bright', label: 'ครูหญิง สดใส', gender: 'female', tone: 'cheerful', description: 'กระฉับกระเฉง ชวนติดตาม', premium: false },
  { id: 'th-female-playful', label: 'ครูหญิง สนุกสนาน', gender: 'female', tone: 'playful', description: 'มีชีวิตชีวา เหมาะกับนิทาน', premium: true },
  { id: 'th-female-doc', label: 'ผู้บรรยายสารคดี (หญิง)', gender: 'female', tone: 'documentary', description: 'นิ่ง มีน้ำหนัก', premium: true },
];

export const VOICE_LANGUAGES: Option<'th' | 'en'>[] = [
  { value: 'th', label: 'ภาษาไทย' },
  { value: 'en', label: 'ภาษาอังกฤษ' },
];

export const SUBTITLE_STYLES: Option<SubtitleStyle>[] = [
  { value: 'bottom', label: 'ซับไตเติลด้านล่าง', hint: 'มาตรฐาน อ่านง่าย' },
  { value: 'highlight', label: 'เน้นคำสำคัญ', hint: 'ไฮไลต์คำศัพท์ในบทเรียน' },
  { value: 'karaoke', label: 'Karaoke', hint: 'ไล่สีตามเสียงพูด' },
  { value: 'caption', label: 'Educational Caption', hint: 'กล่องข้อความแบบสื่อการสอน' },
];

export const SUBTITLE_FONTS: Option<string>[] = [
  { value: 'Sarabun', label: 'Sarabun (ราชการ)' },
  { value: 'Prompt', label: 'Prompt (ทันสมัย)' },
  { value: 'Kanit', label: 'Kanit (หนา อ่านชัด)' },
  { value: 'NotoSansThai', label: 'Noto Sans Thai' },
];

export const SUBTITLE_SIZES: Option<string>[] = [
  { value: '24', label: 'เล็ก' },
  { value: '32', label: 'กลาง' },
  { value: '40', label: 'ใหญ่' },
];

export interface MusicTrack {
  id: string;
  label: string;
  mood: MusicMood;
  /** ที่มาของสิทธิ์ใช้งาน — แสดงในแอปเพื่อยืนยันว่าใช้เชิงพาณิชย์ได้ */
  license: string;
  emoji: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'none', label: 'ไม่ใส่เพลง', mood: 'none', license: '—', emoji: '🔇' },
  { id: 'fun-01', label: 'สนุกสนาน', mood: 'fun', license: 'CC0 / ใช้เชิงพาณิชย์ได้', emoji: '🎉' },
  { id: 'calm-01', label: 'ผ่อนคลาย', mood: 'calm', license: 'CC0 / ใช้เชิงพาณิชย์ได้', emoji: '🌿' },
  { id: 'science-01', label: 'วิทยาศาสตร์', mood: 'science', license: 'CC0 / ใช้เชิงพาณิชย์ได้', emoji: '🔬' },
  { id: 'adventure-01', label: 'Adventure', mood: 'adventure', license: 'CC0 / ใช้เชิงพาณิชย์ได้', emoji: '🧭' },
  { id: 'emotional-01', label: 'Emotional', mood: 'emotional', license: 'CC0 / ใช้เชิงพาณิชย์ได้', emoji: '💙' },
  { id: 'corporate-01', label: 'Corporate', mood: 'corporate', license: 'CC0 / ใช้เชิงพาณิชย์ได้', emoji: '🏢' },
  { id: 'kids-01', label: 'Kids', mood: 'kids', license: 'CC0 / ใช้เชิงพาณิชย์ได้', emoji: '🧒' },
];

export const ASPECT_RATIOS: Option<AspectRatio>[] = [
  { value: '16:9', label: '16:9', hint: 'YouTube / Google Classroom' },
  { value: '9:16', label: '9:16', hint: 'TikTok / Reels / Shorts' },
  { value: '1:1', label: '1:1', hint: 'Facebook / Instagram' },
];

export const RESOLUTIONS: Option<Resolution>[] = [
  { value: '720p', label: '720p', hint: 'ไฟล์เล็ก ส่งไว' },
  { value: '1080p', label: '1080p', hint: 'คมชัด เหมาะกับฉายในห้องเรียน' },
];

export const voiceById = (id: string | null | undefined) =>
  VOICES.find((v) => v.id === id) ?? null;

export const musicById = (id: string | null | undefined) =>
  MUSIC_TRACKS.find((m) => m.id === id) ?? null;
