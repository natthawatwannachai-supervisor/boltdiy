# ระบบบันทึกรายงานการนิเทศ ติดตาม และประเมินผลการจัดการศึกษา

**Educational Supervision, Monitoring and Evaluation Report System**
ของ ศึกษานิเทศก์ สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุโขทัย เขต 2

เว็บแอปพลิเคชันสำหรับให้ศึกษานิเทศก์บันทึกผลการนิเทศได้ทุกที่ทุกเวลา ดูสรุปสถิติรายเดือน
และดาวน์โหลดรายงานสรุปประจำเดือนเป็นไฟล์ PDF ขนาด A4 พร้อมตราสัญลักษณ์ ภาพประกอบ
และลายเซ็นท้ายรายงาน

---

## สารบัญ

- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้งและใช้งาน](#การติดตั้งและใช้งาน)
- [การตั้งค่า Firebase](#การตั้งค่า-firebase)
- [บัญชีผู้ดูแลระบบ](#บัญชีผู้ดูแลระบบ)
- [การเปลี่ยนตราสัญลักษณ์ (โลโก้)](#การเปลี่ยนตราสัญลักษณ์-โลโก้)
- [รายงาน PDF](#รายงาน-pdf)
- [การ Deploy](#การ-deploy)
- [หมายเหตุด้านความปลอดภัย](#หมายเหตุด้านความปลอดภัย)

---

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (ธีม Neumorphism) |
| Motion | Framer Motion |
| Backend | Firebase Authentication / Cloud Firestore / Cloud Storage |
| Admin operations | Cloud Functions for Firebase (callable, region `asia-southeast1`) |
| PDF | jsPDF + jspdf-autotable (ฝังฟอนต์ Sarabun สำหรับภาษาไทย) |
| กราฟ | Recharts |
| บีบอัดรูป | browser-image-compression |
| ลายเซ็น | react-signature-canvas |

## โครงสร้างโปรเจกต์

```
supervision-app/
├── public/
│   ├── logo.svg                  # ตราสัญลักษณ์ (แทนที่ด้วยโลโก้ของหน่วยงาน)
│   └── fonts/                    # ฟอนต์ Sarabun สำหรับฝังลงไฟล์ PDF
├── functions/                    # Cloud Functions (จัดการบัญชีผู้ใช้โดยผู้ดูแลระบบ)
│   └── src/index.ts
├── src/
│   ├── components/
│   │   ├── admin/                # จัดการผู้ใช้งาน (เฉพาะผู้ดูแลระบบ)
│   │   ├── auth/                 # Modal เข้าสู่ระบบ / ลงทะเบียน / ลายเซ็น
│   │   ├── dashboard/            # การ์ดสถิติ กราฟ และการ์ดโปรไฟล์
│   │   ├── home/                 # Hero, จุดเด่น, Motion Infographic 7 ขั้นตอน
│   │   ├── illustrations/        # ภาพประกอบสไตล์ 3D (inline SVG) และโลโก้
│   │   ├── layout/               # Navbar, Footer, Layout, Route guards
│   │   ├── supervision/          # ฟอร์มบันทึก, ตาราง, ตัวกรองเดือน, อัปโหลดรูป
│   │   └── ui/                   # ปุ่ม/ฟิลด์/Modal สไตล์ Neumorphism
│   ├── config/                   # ค่าคงที่ของระบบ และการตั้งค่า Firebase
│   ├── context/                  # AuthContext, ToastContext
│   ├── hooks/                    # useSupervisions
│   ├── pages/                    # หน้าแต่ละหน้าของระบบ
│   ├── services/                 # ชั้นติดต่อ Firebase (auth/firestore/storage)
│   ├── types/                    # TypeScript types
│   └── utils/
│       ├── pdf/                  # ตัวสร้างรายงาน PDF + ฝังฟอนต์ไทย
│       ├── date.ts               # วันที่แบบไทย/พุทธศักราช
│       ├── imageCompression.ts   # บีบอัดรูปให้อยู่ที่ 200–300 KB
│       ├── stats.ts              # สรุปสถิติสำหรับกราฟ
│       └── validation.ts         # ตรวจสอบฟอร์ม (รวมการนับอักษรไทย)
├── firestore.rules               # กฎความปลอดภัยของ Firestore
├── storage.rules                 # กฎความปลอดภัยของ Cloud Storage
└── pdf-preview.html              # เครื่องมือดูตัวอย่างรายงาน PDF (เฉพาะตอนพัฒนา)
```

## การติดตั้งและใช้งาน

ต้องมี **Node.js 20 ขึ้นไป**

```bash
cd supervision-app
npm install
cp .env.example .env      # แล้วกรอกค่าจาก Firebase Console
npm run dev               # เปิด http://localhost:5173
```

คำสั่งอื่น ๆ

```bash
npm run build      # สร้างไฟล์ production ที่ dist/
npm run preview    # ทดลองเปิดไฟล์ production
npm run typecheck  # ตรวจสอบชนิดข้อมูลด้วย TypeScript
```

> หากยังไม่ได้ตั้งค่า Firebase ระบบจะยังเปิดได้ตามปกติ แต่จะมีแถบเตือนสีส้มด้านบน
> และการเข้าสู่ระบบ/บันทึกข้อมูลจะยังทำงานไม่ได้

### ดูตัวอย่างรายงาน PDF โดยไม่ต้องมีข้อมูลจริง

ระหว่างรัน `npm run dev` ให้เปิด <http://localhost:5173/pdf-preview.html>
หน้านี้จะสร้างรายงานจากข้อมูลจำลองเพื่อให้ตรวจสอบเลย์เอาต์ ฟอนต์ไทย และตำแหน่งลายเซ็นได้
(ไม่ถูกรวมเข้าไปในไฟล์ production)

## การตั้งค่า Firebase

1. สร้างโปรเจกต์ที่ <https://console.firebase.google.com>
2. เปิดใช้งาน **Authentication → Sign-in method → Email/Password**
3. สร้าง **Cloud Firestore** และ **Cloud Storage**
4. เพิ่ม Web App แล้วคัดลอกค่าคอนฟิกมาใส่ในไฟล์ `.env`
5. Deploy กฎความปลอดภัยและ Cloud Functions

```bash
npm install -g firebase-tools
firebase login
firebase use --add                       # เลือกโปรเจกต์ของคุณ
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

6. ตั้งค่า CORS ของ Storage เพื่อให้ตัวสร้าง PDF ดึงรูปมาฝังในไฟล์ได้
   (แก้ชื่อโดเมนใน `storage.cors.json` ก่อน)

```bash
gsutil cors set storage.cors.json gs://YOUR-PROJECT.appspot.com
```

### โครงสร้างข้อมูลใน Firestore

| Collection | คำอธิบาย |
| --- | --- |
| `users/{uid}` | โปรไฟล์ศึกษานิเทศก์ (ชื่อ ตำแหน่ง วิทยฐานะ กลุ่มงาน อีเมล เบอร์โทร Line ID ลายเซ็น) |
| `supervisions/{id}` | บันทึกการนิเทศ 1 รายการ (ช่วงวันที่ เวลา งานนิเทศ เรื่อง สถานที่ เนื้อหา รูปภาพ) |
| `admins/{uid}` | เอกสารว่างที่ใช้ระบุว่า uid นี้เป็นผู้ดูแลระบบ (สร้างจาก Console เท่านั้น) |

## บัญชีผู้ดูแลระบบ

ผู้ดูแลระบบเข้าสู่ระบบด้วย **ชื่อผู้ใช้** `adminsupervisor` (ไม่ใช่อีเมล) รหัสผ่าน `adminadmin`
ระบบจะแปลงชื่อผู้ใช้นี้เป็นอีเมลที่กำหนดไว้ใน `VITE_ADMIN_EMAIL` โดยอัตโนมัติ

ขั้นตอนสร้างบัญชีผู้ดูแลระบบ (ทำครั้งเดียว)

1. Firebase Console → **Authentication → Users → Add user**
   - Email: `adminsupervisor@sukhothai2.local` (ตรงกับ `VITE_ADMIN_EMAIL`)
   - Password: `adminadmin`
2. คัดลอก **User UID** ที่ได้
3. Firestore → สร้าง collection `admins` → สร้างเอกสารที่ **Document ID = UID นั้น**
   (จะใส่ฟิลด์อะไรหรือไม่ใส่เลยก็ได้ ระบบตรวจแค่ว่ามีเอกสารนี้อยู่)

สิทธิ์ของผู้ดูแลระบบทั้งหมด — ทั้งการอ่านข้อมูลของทุกคน การแก้ไข/ลบบันทึก และการเปลี่ยน
รหัสผ่าน/อีเมลของผู้ใช้ — ถูกตรวจสอบจากเอกสารใน `admins/{uid}` ทั้งในกฎความปลอดภัยและใน
Cloud Functions ไม่ได้ตรวจจากฝั่งเบราว์เซอร์เพียงอย่างเดียว

## การเปลี่ยนตราสัญลักษณ์ (โลโก้)

แทนที่ไฟล์ `public/logo.svg` ด้วยตราสัญลักษณ์ของหน่วยงาน (รองรับ `.svg`, `.png`, `.jpg`)
หากใช้ชื่อไฟล์อื่นให้ระบุพาธไว้ที่ `VITE_LOGO_URL` ในไฟล์ `.env`

โลโก้ไฟล์เดียวกันนี้จะถูกใช้ทั้งใน Navbar, Footer และหัวรายงาน PDF โดยอัตโนมัติ

## รายงาน PDF

- ขนาด **A4 แนวตั้ง (21.0 × 29.7 ซม.)**
- หัวรายงานมีตราสัญลักษณ์ ชื่อระบบ ชื่อหน่วยงาน เดือนที่รายงาน และข้อมูลผู้รายงาน
- ตารางข้อมูล **จำแนกตามงานนิเทศ** พร้อมตารางสรุปภาพรวมท้ายรายงาน
- ภาคผนวกแสดงภาพประกอบสูงสุด 2 ภาพต่อ 1 บันทึก
- **ลายเซ็น ชื่อ และตำแหน่ง อยู่มุมขวาล่างของหน้าสุดท้ายเท่านั้น** แม้รายงานจะมีหลายหน้า
- ทุกหน้ามีข้อมูลผู้พัฒนาระบบและเลขหน้าที่ท้ายกระดาษ

ภาษาไทยในไฟล์ PDF ใช้ฟอนต์ **Sarabun** ที่ฝังมาใน `public/fonts` (ฟอนต์มาตรฐานของ jsPDF
ไม่มีอักขระภาษาไทย) หากลบไฟล์ฟอนต์ออก ตัวอักษรไทยในรายงานจะแสดงไม่ถูกต้อง

## การ Deploy

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` ตั้งค่า rewrite ทุกเส้นทางไปที่ `index.html` ไว้แล้ว เพื่อให้ React Router
ทำงานได้เมื่อผู้ใช้เปิด URL ตรง ๆ

## หมายเหตุด้านความปลอดภัย

- **รหัสผ่านผู้ดูแลระบบ** ตามข้อกำหนดคือ `adminadmin` ซึ่งเป็นรหัสที่คาดเดาได้ง่ายมาก
  แนะนำอย่างยิ่งให้เปลี่ยนรหัสผ่านของบัญชีนี้ใน Firebase Console หลังติดตั้งเสร็จ
  (ระบบไม่ได้ผูกกับรหัสผ่านค่าเริ่มต้น — เปลี่ยนได้ทันทีโดยไม่ต้องแก้โค้ด)
- ไฟล์ `.env` มีค่าคอนฟิก Firebase ฝั่งเบราว์เซอร์ซึ่งเปิดเผยได้ตามปกติ
  ความปลอดภัยที่แท้จริงมาจาก `firestore.rules` และ `storage.rules` จึงควร deploy กฎทุกครั้ง
- การเปลี่ยนรหัสผ่าน/อีเมลของผู้ใช้คนอื่นต้องใช้ Firebase Admin SDK ซึ่งทำงานบนเบราว์เซอร์ไม่ได้
  ระบบจึงเรียกผ่าน Cloud Functions ที่ตรวจสิทธิ์ผู้ดูแลระบบก่อนเสมอ
  หากยังไม่ได้ deploy functions ปุ่มเหล่านี้จะแจ้งเตือน และยังสามารถใช้ปุ่ม
  “ส่งลิงก์ตั้งรหัสผ่านทางอีเมลแทน” ได้

---

ผู้พัฒนาระบบ: นายณัฐวัฒน์ วรรณชัย ศึกษานิเทศก์ สพป.สุโขทัย เขต 2 | เบอร์โทร: 0987491344 | Line ID: xdeathxsign
