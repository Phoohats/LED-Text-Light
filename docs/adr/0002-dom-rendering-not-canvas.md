# Render the marquee with DOM/CSS transform, not Canvas

ใช้ DOM element + CSS `transform: translateX()` (ขับด้วย rAF) ในการเรนเดอร์ป้ายไฟ
ไม่ใช้ `<canvas>` + `fillText`

## เหตุผล
- **ภาษาไทยถูกต้อง**: Canvas `fillText` เรนเดอร์สระลอย/วรรณยุกต์ซ้อน (เช่น "ตี๋", "ภู่") ผิดตำแหน่งในหลาย engine
  ส่วน DOM ใช้ text-shaping ของระบบ → ไทยถูกเสมอ
- **อิโมจิสี "ฟรี"**: DOM เรนเดอร์ color emoji ของ OS อัตโนมัติ (Apple Color Emoji ฯลฯ) โดยไม่ต้องโหลด sprite
- **GPU + แบตเตอรี่**: `transform` ถูก composite บน GPU ลื่นและกินแบตน้อยกว่าวาด Canvas ทุกเฟรม

## Consequences
- ขนาดตัวอักษรอิงหน่วย viewport (`vh`) แทนการคำนวณ pixel เอง
- เอฟเฟกต์ทำผ่าน CSS animation/filter (blink, hue-rotate)
