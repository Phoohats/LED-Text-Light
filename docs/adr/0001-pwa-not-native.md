# Deliver as a PWA, not a native iOS app

เลือกทำเป็น **Progressive Web App** (เปิดใน Safari → Add to Home Screen) แทน native iOS
เพราะ deploy ผ่าน Firebase Hosting ได้ทันที ไม่ต้องมี Mac/Xcode, ไม่ต้องเสียค่า Apple Developer
และไม่ต้องผ่านการรีวิวของ App Store — เหมาะกับการ iterate เร็วและเข้ากับ repo + Firebase ที่เตรียมไว้

## Consequences
- บางความสามารถถูกจำกัดบน iOS Safari (orientation lock, wake lock รุ่นเก่า) → ออกแบบให้ degrade ได้
- ติดตั้งผ่าน "Add to Home Screen" แทนการโหลดจาก store
