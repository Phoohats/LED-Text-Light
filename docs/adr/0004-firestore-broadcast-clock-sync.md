# Sync via a single Firestore doc + server-timestamp clock-sync

สำหรับโหมดซิงค์หลายเครื่อง (Phase 3) Controller เขียน Sign ที่ active ลง Firestore doc เดียว
(`shows/{code}.activeSign`) พร้อม `startedAt: serverTimestamp()` แล้ว Viewer ฟังผ่าน `onSnapshot`
และคำนวณตำแหน่งวิ่งเองในเครื่องจาก `(now − startedAt − clockSkew)`

## ทางเลือกที่พิจารณา
| ตัวเลือก | Latency | Complexity | ผล |
|---|---|---|---|
| Firestore 1-doc + listener | ~200–800ms | ต่ำ (DB เดียวกับ preset) | ✅ เลือก |
| Realtime Database | ~50–200ms | กลาง (เพิ่มระบบที่ 2) | สำรอง |
| Custom WebSocket server | ต่ำสุด | สูงมาก | ❌ |

## เหตุผล
- broadcast คอนเสิร์ตทน latency < 1s ได้ → ไม่จำเป็นต้องมี RTDB/WebSocket
- ส่ง payload เล็กเฉพาะตอนเปลี่ยน + ให้แอนิเมชันรันในเครื่อง → ลื่นและประหยัด read
- clock-sync ด้วย serverTimestamp ทำให้ทุกเครื่องวิ่งตรงกันแม้เน็ตหน่วงต่างกัน
- ซ่อนหลัง port `ShowChannel` → สลับไป RTDB ภายหลังได้โดยไม่แตะโดเมน

## Consequences
- ต้อง probe clock offset ตอน join
- กฎ Firestore: เฉพาะ Controller (ownerUid) เขียน activeSign ได้
