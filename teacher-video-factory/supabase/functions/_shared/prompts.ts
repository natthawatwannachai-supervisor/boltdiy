/**
 * Prompt กลางของระบบ (สเปกข้อ 10 และ 12)
 * หลักการ: ใช้ภาษาไทยที่เหมาะกับวัย ไม่ใช้ศัพท์เกินระดับชั้น ความยาวตรงกับเวลาที่กำหนด
 * เลี่ยงข้อมูลที่ตรวจสอบไม่ได้ และแบ่งเป็นฉากที่มีครบทั้งภาพ เสียง ข้อความ และ transition
 */

export const GRADE_LABEL: Record<string, string> = {
  k1: 'อนุบาล 1', k2: 'อนุบาล 2', k3: 'อนุบาล 3',
  p1: 'ประถมศึกษาปีที่ 1', p2: 'ประถมศึกษาปีที่ 2', p3: 'ประถมศึกษาปีที่ 3',
  p4: 'ประถมศึกษาปีที่ 4', p5: 'ประถมศึกษาปีที่ 5', p6: 'ประถมศึกษาปีที่ 6',
  m1: 'มัธยมศึกษาปีที่ 1', m2: 'มัธยมศึกษาปีที่ 2', m3: 'มัธยมศึกษาปีที่ 3',
  m4: 'มัธยมศึกษาปีที่ 4', m5: 'มัธยมศึกษาปีที่ 5', m6: 'มัธยมศึกษาปีที่ 6',
  voc: 'อาชีวศึกษา', other: 'อื่น ๆ',
};

export const SUBJECT_LABEL: Record<string, string> = {
  thai: 'ภาษาไทย', math: 'คณิตศาสตร์', science: 'วิทยาศาสตร์', social: 'สังคมศึกษา',
  english: 'ภาษาอังกฤษ', health: 'สุขศึกษา', art: 'ศิลปะ', career: 'การงานอาชีพ',
  technology: 'เทคโนโลยี', foreign: 'ภาษาต่างประเทศ', other: 'อื่น ๆ',
};

export const FORMAT_LABEL: Record<string, string> = {
  lesson: 'บทเรียนที่สอนเนื้อหาตามลำดับ',
  story: 'นิทานการศึกษาที่สอดแทรกความรู้',
  experiment: 'การสาธิตการทดลองวิทยาศาสตร์',
  concept: 'การอธิบายแนวคิดเดียวแบบเจาะลึก',
  news: 'รายงานข่าวการศึกษา',
  exam_prep: 'การติวสรุปจุดที่ออกสอบ',
  micro: 'Micro Learning สั้นกระชับหนึ่งประเด็น',
  short: 'Short Video แนวตั้งสำหรับโซเชียล',
  animation: 'Animation เล่าเรื่องด้วยภาพเคลื่อนไหว',
};

export const STYLE_PROMPT: Record<string, string> = {
  teacher_talk: 'friendly Thai teacher presenting in a classroom, warm lighting, realistic style',
  animation: '2D animated educational illustration, smooth vector shapes, bright colors',
  infographic: 'clean educational infographic, labeled diagram, flat design, plenty of white space',
  cartoon: 'cheerful cartoon illustration for children, rounded shapes, playful colors',
  cinematic: 'cinematic photographic scene, dramatic lighting, shallow depth of field',
  minimal: 'minimal flat illustration, limited palette, lots of negative space',
  three_d: 'polished 3D render, soft studio lighting, educational diorama style',
  whiteboard: 'hand-drawn whiteboard marker illustration, black outlines on white background',
};

const SYSTEM_BASE = `คุณคือผู้เชี่ยวชาญด้านการออกแบบสื่อการสอนของไทย ทำงานร่วมกับครูในระบบการศึกษาขั้นพื้นฐาน
กฎที่ต้องยึดถือเสมอ:
1. ใช้ภาษาไทยที่ถูกต้องและเหมาะกับช่วงวัยของผู้เรียน
2. ห้ามใช้ศัพท์วิชาการเกินระดับชั้นที่กำหนด หากจำเป็นต้องใช้ ให้อธิบายความหมายทันที
3. เนื้อหาต้องอ้างอิงข้อเท็จจริงที่ตรวจสอบได้ ห้ามแต่งตัวเลข สถิติ ชื่อบุคคล หรือเหตุการณ์ขึ้นเอง
4. ถ้าหัวข้อมีข้อถกเถียงทางวิชาการ ให้เลือกคำอธิบายที่เป็นฉันทามติในหลักสูตรแกนกลาง
5. น้ำเสียงเป็นมิตร ชวนคิด และให้เกียรติผู้เรียน
6. ตอบกลับตามรูปแบบที่กำหนดเท่านั้น`;

export const systemPrompt = () => SYSTEM_BASE;

export interface LessonContext {
  topic: string;
  gradeLevel: string;
  subject: string;
  durationMin: number;
  format: string;
  style: string;
  objectives?: string[];
}

const contextBlock = (ctx: LessonContext) => `หัวข้อบทเรียน: ${ctx.topic}
ระดับชั้น: ${GRADE_LABEL[ctx.gradeLevel] ?? ctx.gradeLevel}
วิชา: ${SUBJECT_LABEL[ctx.subject] ?? ctx.subject}
ความยาววิดีโอ: ${ctx.durationMin} นาที (${ctx.durationMin * 60} วินาที)
รูปแบบวิดีโอ: ${FORMAT_LABEL[ctx.format] ?? ctx.format}${
  ctx.objectives?.length
    ? `\nวัตถุประสงค์การเรียนรู้:\n${ctx.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
    : ''
}`;

/** วิเคราะห์ประโยคเดียวของครูให้เป็นข้อมูลบทเรียนที่มีโครงสร้าง */
export const analyzePrompt = (userInput: string) => `ครูพิมพ์ข้อความต่อไปนี้เพื่อสั่งสร้างวิดีโอการสอน:
"""
${userInput}
"""

จงตีความและเติมค่าที่ครูไม่ได้ระบุด้วยค่าที่เหมาะสมที่สุด แล้วตอบเป็น JSON ตามโครงสร้างนี้:
{
  "topic": "หัวข้อบทเรียนที่กระชับ",
  "grade_level": "หนึ่งใน k1,k2,k3,p1..p6,m1..m6,voc,other",
  "subject": "หนึ่งใน thai,math,science,social,english,health,art,career,technology,foreign,other",
  "duration_min": 1 | 3 | 5 | 10 | 15,
  "format": "หนึ่งใน lesson,story,experiment,concept,news,exam_prep,micro,short,animation",
  "style": "หนึ่งใน teacher_talk,animation,infographic,cartoon,cinematic,minimal,three_d,whiteboard",
  "suggested_title": "ชื่อวิดีโอที่ชวนให้อยากดู ไม่เกิน 40 ตัวอักษร",
  "detected": [
    { "field": "grade_level" | "subject" | "duration_min" | "format" | "style" | "topic",
      "label": "ชื่อฟิลด์ภาษาไทย เช่น ระดับชั้น",
      "value": "ค่าที่อ่านได้ภาษาไทย เช่น ป.5" }
  ]
}

ใน detected ให้ใส่เฉพาะสิ่งที่สรุปได้จากข้อความของครูหรืออนุมานได้อย่างมั่นใจ เรียงตาม topic, subject, grade_level, duration_min`;

/** วัตถุประสงค์การเรียนรู้ */
export const objectivesPrompt = (ctx: LessonContext) => `${contextBlock(ctx)}

จงเขียนวัตถุประสงค์การเรียนรู้ 3-4 ข้อ ที่วัดผลได้จริงหลังนักเรียนดูวิดีโอจบ
ขึ้นต้นทุกข้อด้วย "นักเรียนสามารถ" และลงท้ายด้วย "ได้"
ไล่ระดับพฤติกรรมจากง่ายไปยากตามแนวคิดของ Bloom

ตอบเป็น JSON:
{ "objectives": [ { "text": "นักเรียนสามารถ...ได้", "bloom": "remember|understand|apply|analyze|evaluate|create" } ] }`;

/** บทวิดีโอแบ่งเป็นฉาก */
export const scriptPrompt = (ctx: LessonContext, sceneCount: number, secondsPerScene: number) =>
  `${contextBlock(ctx)}

จงเขียนบทวิดีโอการสอนแบ่งเป็น ${sceneCount} ฉาก แต่ละฉากยาวประมาณ ${secondsPerScene} วินาที
รวมทั้งคลิปต้องยาว ${ctx.durationMin * 60} วินาทีพอดี

ข้อกำหนดของแต่ละฉาก:
- visual: อธิบายภาพที่ควรปรากฏบนจอเป็นภาษาไทย 1-2 ประโยค
- narration: บทพูดของผู้บรรยายภาษาไทย ความยาวประมาณ ${Math.round(secondsPerScene * 3)} คำ
  (คนไทยพูดราว 3 คำต่อวินาที) ต้องอ่านออกเสียงลื่นและเหมาะกับ${GRADE_LABEL[ctx.gradeLevel] ?? ctx.gradeLevel}
- on_screen_text: ข้อความสั้นบนหน้าจอไม่เกิน 20 ตัวอักษร
- transition: หนึ่งใน fade, crossfade, slideLeft, slideUp, zoom

โครงเรื่องที่ต้องมี: ฉากแรกเปิดด้วยคำถามชวนสงสัย ฉากกลางอธิบายเนื้อหาตามลำดับที่เข้าใจง่าย
ฉากสุดท้ายสรุปและชวนให้นักเรียนนำไปใช้ต่อ

ตอบเป็น JSON:
{
  "hook": "ประโยคเปิดที่ดึงความสนใจ",
  "summary": "สรุปเนื้อหาทั้งคลิปใน 1-2 ประโยค",
  "scenes": [
    { "visual": "...", "narration": "...", "on_screen_text": "...", "transition": "fade" }
  ]
}`;

export const regenerateScenePrompt = (
  ctx: LessonContext,
  scene: { index: number; visual: string; narration: string },
  instruction?: string,
) => `${contextBlock(ctx)}

นี่คือฉากที่ ${scene.index + 1} ของบทวิดีโอปัจจุบัน:
- ภาพ: ${scene.visual}
- เสียงบรรยาย: ${scene.narration}

${instruction ? `ครูขอให้ปรับตามนี้: ${instruction}` : 'จงเขียนฉากนี้ใหม่ให้น่าสนใจขึ้นโดยคงประเด็นเดิมไว้'}

ตอบเป็น JSON: { "visual": "...", "narration": "...", "on_screen_text": "...", "transition": "fade" }`;

export const addScenePrompt = (
  ctx: LessonContext,
  previousNarration: string | null,
  nextNarration: string | null,
) => `${contextBlock(ctx)}

จงเขียนฉากใหม่ 1 ฉากเพื่อแทรกระหว่างสองฉากนี้ให้เนื้อหาต่อเนื่องกัน
ฉากก่อนหน้า: ${previousNarration ?? '(เป็นฉากแรกของคลิป)'}
ฉากถัดไป: ${nextNarration ?? '(เป็นฉากสุดท้ายของคลิป)'}

ตอบเป็น JSON: { "visual": "...", "narration": "...", "on_screen_text": "...", "transition": "fade" }`;

/** Prompt ภาพของแต่ละฉาก — เขียนเป็นภาษาอังกฤษเพราะโมเดลภาพเข้าใจได้แม่นกว่า */
export const imagePromptRequest = (ctx: LessonContext, scenes: { index: number; visual: string }[]) =>
  `${contextBlock(ctx)}

สไตล์ภาพที่ครูเลือก: ${STYLE_PROMPT[ctx.style] ?? ctx.style}

จงเขียน prompt ภาษาอังกฤษสำหรับสร้างภาพประกอบของแต่ละฉากด้านล่าง
ข้อกำหนดของ prompt แต่ละอัน:
- อธิบายสิ่งที่เห็นในภาพอย่างละเอียด เหมาะกับสื่อการสอน
- ระบุสไตล์ตามที่ครูเลือกไว้
- ต้องถูกต้องตามหลักวิชาการ (scientifically accurate) ถ้าเป็นวิชาวิทยาศาสตร์
- ห้ามมีตัวหนังสือในภาพ ให้ระบุ "no text, no watermark"
- ไม่ใส่ชื่อบุคคลจริงหรือเครื่องหมายการค้า

ฉากทั้งหมด:
${scenes.map((s) => `${s.index + 1}. ${s.visual}`).join('\n')}

ตอบเป็น JSON: { "prompts": [ { "index": 0, "prompt": "..." } ] }`;

export const thumbnailPrompt = (ctx: LessonContext) => `${contextBlock(ctx)}

จงคิดพาดหัว Thumbnail 3 แบบสำหรับวิดีโอนี้ ให้ครูเลือก
- แบบที่ 1: ตั้งเป็นคำถามชวนสงสัย
- แบบที่ 2: ใช้คำที่กระตุ้นความอยากรู้
- แบบที่ 3: บอกประโยชน์และเวลาที่ใช้ดู

พาดหัวแต่ละแบบไม่เกิน 22 ตัวอักษร และเขียน prompt ภาษาอังกฤษสำหรับสร้างภาพพื้นหลังของแต่ละแบบ

ตอบเป็น JSON: { "options": [ { "headline": "...", "image_prompt": "..." } ] }`;

export const subtitlePrompt = (narrations: string[], language: 'th' | 'en') =>
  `ต่อไปนี้คือบทบรรยายของวิดีโอการสอนแยกตามฉาก

${narrations.map((n, i) => `[ฉาก ${i + 1}] ${n}`).join('\n')}

จงแบ่งเป็นบรรทัด Subtitle ที่อ่านทันขณะดู โดย
- แต่ละบรรทัดยาวไม่เกิน 42 ตัวอักษร
- ตัดบรรทัดตามวรรคตอนและหน่วยความหมาย ไม่ตัดกลางคำ
- ระบุคำสำคัญของบรรทัดนั้นไว้ใน keywords เพื่อใช้ไฮไลต์ (ถ้ามี)
${language === 'en' ? '- แปลเป็นภาษาอังกฤษไว้ในฟิลด์ text_en ด้วย' : ''}

ตอบเป็น JSON:
{ "cues": [ { "scene_index": 0, "text_th": "...", ${language === 'en' ? '"text_en": "...", ' : ''}"keywords": ["..."] } ] }`;

export const qualityPrompt = (
  ctx: LessonContext,
  facts: {
    sceneCount: number;
    totalSeconds: number;
    imagesReady: number;
    audioReady: number;
    subtitleCount: number;
    narrations: string[];
  },
) => `${contextBlock(ctx)}

ข้อมูลจริงของวิดีโอที่สร้างเสร็จแล้ว:
- จำนวนฉาก: ${facts.sceneCount}
- ความยาวรวม: ${facts.totalSeconds} วินาที (เป้าหมาย ${ctx.durationMin * 60} วินาที)
- ฉากที่มีภาพประกอบแล้ว: ${facts.imagesReady}/${facts.sceneCount}
- ฉากที่มีเสียงบรรยายแล้ว: ${facts.audioReady}/${facts.sceneCount}
- จำนวนบรรทัด Subtitle: ${facts.subtitleCount}

บทบรรยายทั้งหมด:
${facts.narrations.map((n, i) => `[ฉาก ${i + 1}] ${n}`).join('\n')}

จงตรวจสอบคุณภาพ 6 ด้าน แล้วให้คะแนนรวม 0-100 พร้อมคำแนะนำที่ทำได้จริง 1-3 ข้อ
ด้านที่ต้องตรวจ: content (ความเหมาะสมกับระดับชั้น), script (ความยาวเทียบเป้าหมาย),
visual (ภาพครบทุกฉาก), audio (เสียงครบทุกฉาก), subtitle (Subtitle ครบ),
objective (ครอบคลุมวัตถุประสงค์)

ตอบเป็น JSON:
{
  "score": 92,
  "checks": [ { "key": "content", "label": "เนื้อหา", "passed": true, "detail": "..." } ],
  "suggestions": ["..."]
}`;

export const assistantSystemPrompt = () => `${SYSTEM_BASE}

คุณคือ "น้อง Teacher AI" ผู้ช่วยผลิตสื่อการสอนในแอป Teacher Video Factory
คุณช่วยครูได้ในเรื่องเหล่านี้: ปรับบทวิดีโอให้น่าสนใจขึ้น สร้างแบบทดสอบ ใบงาน
คำถามท้ายบท Exit Ticket กิจกรรมในชั้นเรียน และใบความรู้

ถ้าครูขอให้ "สร้างวิดีโอ" เรื่องใดเรื่องหนึ่ง ให้ตอบยืนยันสั้น ๆ แล้วส่ง action กลับมาด้วย
ตอบเป็นภาษาไทยที่เป็นกันเอง กระชับ อ่านบนมือถือได้สบาย

ตอบเป็น JSON เสมอ:
{
  "reply": "ข้อความตอบครู",
  "artifact": null | { "kind": "quiz|worksheet|exit_ticket|activity|handout|chapter_questions", "title": "...", "items": [...] },
  "action": null | { "type": "create_video", "prompt": "หัวข้อ ระดับชั้น ความยาว" }
}`;

export const lessonKitPrompt = (ctx: LessonContext, narrations: string[]) =>
  `${contextBlock(ctx)}

บทวิดีโอที่ใช้สอนจริง:
${narrations.map((n, i) => `[ฉาก ${i + 1}] ${n}`).join('\n')}

จงสร้างชุดสื่อการสอนครบชุดจากบทเรียนนี้ สำหรับครูไทยนำไปใช้ได้ทันที

ตอบเป็น JSON:
{
  "lesson_plan": "แผนการจัดการเรียนรู้ 1 ชั่วโมง ประกอบด้วย สาระสำคัญ จุดประสงค์ สื่อ/อุปกรณ์ กิจกรรมขั้นนำ ขั้นสอน ขั้นสรุป และการวัดผล",
  "slides_outline": "โครงสไลด์ PowerPoint 8-10 สไลด์ ระบุหัวข้อและ bullet ของแต่ละสไลด์",
  "worksheet": "ใบงาน 1 หน้า มีคำชี้แจงและคำถาม 5 ข้อ พร้อมเว้นที่ให้เขียนตอบ",
  "quiz": "แบบทดสอบปรนัย 5 ข้อ 4 ตัวเลือก พร้อมเฉลยและคำอธิบายเฉลย",
  "handout": "ใบความรู้สรุปเนื้อหาสำคัญ 1 หน้า อ่านง่าย มีหัวข้อย่อย"
}`;
