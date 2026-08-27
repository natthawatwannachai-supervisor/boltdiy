import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Card, GradientHeader, SegmentedControl, Text } from '@/components/ui';
import { useState } from 'react';
import { th } from '@/i18n/th';

const TERMS = [
  {
    title: '1. การให้บริการ',
    body: `${th.appName} (${th.appNameTh}) ให้บริการเครื่องมือผลิตสื่อการสอนด้วยปัญญาประดิษฐ์ สำหรับครูและบุคลากรทางการศึกษา ผู้ใช้ต้องมีอายุ 18 ปีขึ้นไป หรือได้รับความยินยอมจากสถานศึกษาต้นสังกัด`,
  },
  {
    title: '2. สิทธิ์ในผลงาน',
    body: 'สื่อการสอนที่คุณสร้างผ่านแอปเป็นของคุณ คุณนำไปใช้ในการเรียนการสอนและเผยแพร่ได้ รวมถึงการใช้เชิงพาณิชย์เมื่ออยู่ในแพ็กเกจแบบชำระเงิน เพลงประกอบทุกแทร็กในระบบผ่านการตรวจสอบสิทธิ์การใช้งานเชิงพาณิชย์แล้ว',
  },
  {
    title: '3. ความถูกต้องของเนื้อหา',
    body: 'เนื้อหาที่สร้างโดย AI เป็นเพียงร่างเพื่อช่วยลดเวลาเตรียมสื่อ ครูผู้ใช้มีหน้าที่ตรวจสอบความถูกต้องทางวิชาการก่อนนำไปใช้กับนักเรียน ผู้ให้บริการไม่รับผิดชอบต่อความคลาดเคลื่อนของเนื้อหาที่ไม่ได้รับการตรวจสอบ',
  },
  {
    title: '4. เครดิตและการชำระเงิน',
    body: 'ทุกการเรียกใช้ AI จะหักเครดิตตามอัตราที่แสดงในแอป เครดิตที่ได้จากแพ็กเกจรายเดือนจะรีเซ็ตทุกรอบบิล ส่วนเครดิตที่ซื้อเพิ่มไม่มีวันหมดอายุ การยกเลิกแพ็กเกจมีผลเมื่อสิ้นสุดรอบบิลปัจจุบัน',
  },
  {
    title: '5. การใช้งานที่ห้าม',
    body: 'ห้ามใช้บริการสร้างเนื้อหาที่ผิดกฎหมาย ละเมิดลิขสิทธิ์ผู้อื่น เนื้อหาที่ไม่เหมาะสมกับผู้เรียน หรือเนื้อหาที่บิดเบือนข้อเท็จจริงโดยเจตนา',
  },
];

const PRIVACY = [
  {
    title: '1. ข้อมูลที่เราเก็บ',
    body: 'ชื่อ นามสกุล อีเมลหรือเบอร์โทรศัพท์ ตำแหน่ง สถานศึกษา สังกัด ระดับชั้นและวิชาที่สอน รวมถึงเนื้อหาบทเรียนที่คุณสร้าง เราเก็บเท่าที่จำเป็นต่อการให้บริการเท่านั้น',
  },
  {
    title: '2. การใช้ข้อมูล',
    body: 'ข้อมูลโปรไฟล์ถูกใช้เพื่อปรับระดับภาษาและเนื้อหาให้เหมาะกับผู้เรียนของคุณ ข้อมูลการใช้งานแบบไม่ระบุตัวตนถูกใช้เพื่อพัฒนาคุณภาพบริการ เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม',
  },
  {
    title: '3. ผู้ให้บริการภายนอก',
    body: 'เนื้อหาที่คุณป้อนจะถูกส่งไปประมวลผลกับผู้ให้บริการ AI ที่เราคัดเลือก เพื่อสร้างบท ภาพ และเสียง เราส่งเฉพาะข้อมูลที่จำเป็นและไม่ส่งข้อมูลส่วนบุคคลของนักเรียน',
  },
  {
    title: '4. สิทธิ์ของเจ้าของข้อมูล',
    body: 'ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล คุณมีสิทธิ์ขอเข้าถึง แก้ไข ดาวน์โหลด และลบข้อมูลของคุณได้ตลอดเวลา ผ่านเมนูตั้งค่า > ความเป็นส่วนตัว',
  },
  {
    title: '5. ความปลอดภัย',
    body: 'ข้อมูลถูกเข้ารหัสระหว่างการรับส่ง ฐานข้อมูลบังคับใช้ Row Level Security ให้แต่ละบัญชีเข้าถึงได้เฉพาะข้อมูลของตนเอง และคีย์ของผู้ให้บริการ AI ถูกเก็บไว้ฝั่งเซิร์ฟเวอร์เท่านั้น ไม่เคยอยู่ในแอปมือถือ',
  },
];

export default function LegalScreen() {
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');
  const sections = tab === 'terms' ? TERMS : PRIVACY;

  return (
    <View style={styles.flex}>
      <GradientHeader title="ข้อกำหนดและความเป็นส่วนตัว" showBack />

      <View style={styles.tabs}>
        <SegmentedControl
          segments={[
            { value: 'terms', label: 'ข้อกำหนดการใช้งาน' },
            { value: 'privacy', label: 'นโยบายความเป็นส่วนตัว' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <Card key={section.title} style={styles.section}>
            <Text variant="bodyStrong">{section.title}</Text>
            <Text variant="small" color={colors.textSecondary}>
              {section.body}
            </Text>
          </Card>
        ))}

        <Text variant="caption" color={colors.textMuted}>
          ปรับปรุงล่าสุด: 2568 · ติดต่อเจ้าหน้าที่คุ้มครองข้อมูลได้ที่ privacy@tvfactory.co.th
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  tabs: { padding: spacing.lg, paddingBottom: 0 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['4xl'] },
  section: { gap: spacing.sm },
});
