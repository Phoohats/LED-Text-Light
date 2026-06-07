# LED-Text-Light

แอป PWA ทำให้มือถือ/แท็บเล็ตกลายเป็นป้ายไฟวิ่งสำหรับชูในคอนเสิร์ต
รองรับไทย/อังกฤษ/อิโมจิ ใช้เดี่ยวก็ได้ หรือซิงค์หลายเครื่องให้โชว์ข้อความเดียวกัน

## Language

**Sign** (ป้ายไฟ):
การตั้งค่าภาพที่แสดงผล = ข้อความ + สไตล์ (สี/ความเร็ว/เอฟเฟกต์) ที่กำลังวิ่งบนจอ คือ entity แกนกลางของระบบ
_Avoid_: banner, display, light, ป้าย

**Message** (ข้อความ):
เนื้อหาตัวอักษรไทย/อังกฤษ/อิโมจิภายใน Sign หนึ่งอัน
_Avoid_: text, caption

**Preset** (พรีเซ็ต):
Sign ที่ถูกบันทึกไว้ใช้ซ้ำได้ ทั้งในเครื่องและบนคลาวด์
_Avoid_: template, saved, favorite

**Show** (โชว์):
เซสชันซิงค์ครั้งหนึ่ง = Controller หนึ่ง + Viewer หลายเครื่อง ที่แชร์ Sign ที่กำลัง active ร่วมกัน
_Avoid_: room, session, party, group

**Controller** (คนคุม):
เครื่อง/ผู้ใช้ที่เป็นเจ้าของ Show และเป็นคนเดียวที่ push Sign ที่ active ได้
_Avoid_: host, admin, master, owner

**Viewer** (ผู้ชม):
เครื่องที่เข้าร่วม Show แล้วสะท้อน (mirror) Sign ของ Controller — แก้ Sign เองไม่ได้
_Avoid_: client, member, guest, slave

**Room code** (รหัสห้อง):
รหัสสั้น 4–6 หลักสำหรับเข้าร่วม Show (มาคู่กับ QR และลิงก์)
_Avoid_: pin, password, key
