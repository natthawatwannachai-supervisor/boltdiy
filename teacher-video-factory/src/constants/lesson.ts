import type {
  EducationStage,
  GradeLevel,
  SubjectKey,
  VideoFormat,
  VisualStyle,
} from '@/types/domain';

export interface Option<T extends string> {
  value: T;
  label: string;
  emoji?: string;
  hint?: string;
}

export const EDUCATION_STAGES: Option<EducationStage>[] = [
  { value: 'kindergarten', label: 'อนุบาล', emoji: '🧸' },
  { value: 'primary', label: 'ประถมศึกษา', emoji: '🎒' },
  { value: 'secondary', label: 'มัธยมศึกษา', emoji: '📗' },
  { value: 'vocational', label: 'อาชีวศึกษา', emoji: '🛠️' },
  { value: 'other', label: 'อื่น ๆ', emoji: '✨' },
];

export const GRADE_LEVELS: Option<GradeLevel>[] = [
  { value: 'k1', label: 'อนุบาล 1' },
  { value: 'k2', label: 'อนุบาล 2' },
  { value: 'k3', label: 'อนุบาล 3' },
  { value: 'p1', label: 'ป.1' },
  { value: 'p2', label: 'ป.2' },
  { value: 'p3', label: 'ป.3' },
  { value: 'p4', label: 'ป.4' },
  { value: 'p5', label: 'ป.5' },
  { value: 'p6', label: 'ป.6' },
  { value: 'm1', label: 'ม.1' },
  { value: 'm2', label: 'ม.2' },
  { value: 'm3', label: 'ม.3' },
  { value: 'm4', label: 'ม.4' },
  { value: 'm5', label: 'ม.5' },
  { value: 'm6', label: 'ม.6' },
  { value: 'voc', label: 'อาชีวศึกษา' },
  { value: 'other', label: 'อื่น ๆ' },
];

/** ระดับชั้นที่ให้เลือกในหน้าสร้างวิดีโอ (ตามสเปก: ป.1–ป.6 และ ม.1–ม.6) */
export const CREATE_GRADE_LEVELS = GRADE_LEVELS.filter((g) =>
  /^(p|m)[1-6]$/.test(g.value),
);

export const SUBJECTS: Option<SubjectKey>[] = [
  { value: 'thai', label: 'ภาษาไทย', emoji: '📖' },
  { value: 'math', label: 'คณิตศาสตร์', emoji: '🔢' },
  { value: 'science', label: 'วิทยาศาสตร์', emoji: '🔬' },
  { value: 'social', label: 'สังคมศึกษา', emoji: '🌏' },
  { value: 'english', label: 'ภาษาอังกฤษ', emoji: '🔤' },
  { value: 'health', label: 'สุขศึกษา', emoji: '🏃' },
  { value: 'art', label: 'ศิลปะ', emoji: '🎨' },
  { value: 'career', label: 'การงานอาชีพ', emoji: '🧑‍🍳' },
  { value: 'technology', label: 'เทคโนโลยี', emoji: '💻' },
  { value: 'foreign', label: 'ภาษาต่างประเทศ', emoji: '🗺️' },
  { value: 'other', label: 'อื่น ๆ', emoji: '✨' },
];

export const DURATION_OPTIONS: Option<string>[] = [
  { value: '1', label: '1 นาที', hint: 'คลิปสั้น เปิดประเด็น' },
  { value: '3', label: '3 นาที', hint: 'สรุปแนวคิดเดียว' },
  { value: '5', label: '5 นาที', hint: 'แนะนำสำหรับ 1 บทเรียนย่อย' },
  { value: '10', label: '10 นาที', hint: 'อธิบายละเอียด' },
  { value: '15', label: '15 นาที', hint: 'บทเรียนเต็ม' },
];

export const VIDEO_FORMATS: Option<VideoFormat>[] = [
  { value: 'lesson', label: 'บทเรียน', emoji: '🎓', hint: 'สอนเนื้อหาตามลำดับ' },
  { value: 'story', label: 'นิทานการศึกษา', emoji: '📖', hint: 'เล่าเรื่องสอดแทรกความรู้' },
  { value: 'experiment', label: 'ทดลองวิทยาศาสตร์', emoji: '🧪', hint: 'สาธิตขั้นตอนการทดลอง' },
  { value: 'concept', label: 'อธิบายแนวคิด', emoji: '🧠', hint: 'เจาะลึกแนวคิดเดียว' },
  { value: 'news', label: 'ข่าวการศึกษา', emoji: '📰', hint: 'รายงานแบบข่าว' },
  { value: 'exam_prep', label: 'ติวสอบ', emoji: '🎯', hint: 'สรุปจุดออกสอบ' },
  { value: 'micro', label: 'Micro Learning', emoji: '💡', hint: 'สั้น กระชับ 1 ประเด็น' },
  { value: 'short', label: 'Short Video', emoji: '📱', hint: 'แนวตั้งสำหรับโซเชียล' },
  { value: 'animation', label: 'Animation', emoji: '🎬', hint: 'ภาพเคลื่อนไหวเต็มรูปแบบ' },
];

export const VISUAL_STYLES: Option<VisualStyle>[] = [
  { value: 'teacher_talk', label: 'ครูบรรยาย', emoji: '🧑‍🏫' },
  { value: 'animation', label: 'Animation', emoji: '🎞️' },
  { value: 'infographic', label: 'Infographic', emoji: '📊' },
  { value: 'cartoon', label: 'Cartoon', emoji: '🐣' },
  { value: 'cinematic', label: 'Cinematic', emoji: '🎥' },
  { value: 'minimal', label: 'Minimal', emoji: '⬜' },
  { value: 'three_d', label: '3D', emoji: '🧊' },
  { value: 'whiteboard', label: 'Whiteboard', emoji: '🖊️' },
];

const labelMap = <T extends string>(options: Option<T>[]) =>
  Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<T, string>;

export const gradeLabel = labelMap(GRADE_LEVELS);
export const subjectLabel = labelMap(SUBJECTS);
export const formatLabel = labelMap(VIDEO_FORMATS);
export const styleLabel = labelMap(VISUAL_STYLES);
export const stageLabel = labelMap(EDUCATION_STAGES);

export const subjectEmoji = Object.fromEntries(
  SUBJECTS.map((s) => [s.value, s.emoji ?? '📘']),
) as Record<SubjectKey, string>;
