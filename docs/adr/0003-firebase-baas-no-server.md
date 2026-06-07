# Use Firebase BaaS, no custom backend server

ใช้ Firebase (Hosting + Firestore + Anonymous Auth + ภายหลังอาจ RTDB) เป็น backend ทั้งหมด
ไม่เขียน/โฮสต์ server เอง

## เหตุผล
- scale ของแอป (ป้ายไฟแฟนคลับ) ไม่คุ้มกับภาระดูแล server เอง (scaling, ops, security patching)
- Firestore listener fan-out (1 doc → N viewers) รองรับ broadcast ได้ในตัว
- Firebase free tier (Spark) เพียงพอช่วงแรก, ขยับเป็น Blaze เมื่อโต

## Consequences
- ผูกกับ Firebase ระดับหนึ่ง → ลดความเสี่ยงด้วยการซ่อนหลัง ports (ดู ADR-0006)
