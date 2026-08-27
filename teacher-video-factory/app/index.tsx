import { Redirect } from 'expo-router';

/** หน้าเริ่มต้น — ตัวจริงถูกตัดสินใจโดย useAuthGate ใน _layout */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
