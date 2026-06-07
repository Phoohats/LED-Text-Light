# LED Text Light — ป้ายไฟวิ่งคอนเสิร์ต 🎤💡

PWA ที่เปลี่ยนมือถือ/iPad ให้เป็น **ป้ายไฟวิ่ง** สำหรับชูในคอนเสิร์ต
รองรับ **ไทย / อังกฤษ / อิโมจิ**, ฟอนต์ 10 แบบ, ใช้งาน offline ได้

> สถานะ: **Phase 0 + 1** (single-device, offline) — โหมดซิงค์หลายเครื่องอยู่ Phase 2–3

## รันบนเครื่อง
```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm test         # unit test โดเมน (sign + animation)
npm run build    # typecheck + build PWA ลง dist/
```

## ฟีเจอร์ Phase 1
- พิมพ์ข้อความไทย/อังกฤษ/อิโมจิ → แสดงเป็นป้ายไฟเต็มจอ
- ฟอนต์ 10 แบบ, เลือกสีตัวอักษร + สีพื้นหลัง, ปรับความเร็ว
- เอฟเฟกต์: วิ่ง / กระพริบ / นิ่ง / สายรุ้ง · ทิศทาง ←/→ · ตัวหนา
- บันทึก/โหลด/ลบ พรีเซ็ต (เก็บใน localStorage)
- กันจอดับ (Wake Lock), เต็มจอ, แตะเพื่อเปิดแถบควบคุม
- ติดตั้งเป็นแอป (Add to Home Screen)

## โครงสร้าง (Hexagonal-lite — ดู `docs/adr/0006`)
```
src/
├── domain/   pure: sign.ts · animation.ts · ports.ts   (ไม่มี DOM/Firebase)
├── app/      use-cases: presetService.ts
├── infra/    adapters: localPresetStore.ts             (Phase 2 → Firestore)
├── ui/       EditorView · DisplayView · wakeLock
├── config/   fonts.ts (10 ฟอนต์ + emoji fallback)
└── main.ts
```

## Roadmap
| Phase | สถานะ | สรุป |
|---|---|---|
| 0 Scaffold | ✅ | Vite + TS + PWA |
| 1 Single Sign | ✅ | editor + จอเต็ม + preset (local) + offline |
| 2 Cloud presets | ⬜ | Firebase Hosting + Firestore + Anonymous Auth |
| 3 Sync broadcast | ⬜ | Show + รหัส/QR/ลิงก์ + clock-sync |

ดูบริบทโดเมนที่ [`CONTEXT.md`](./CONTEXT.md) และการตัดสินใจที่ [`docs/adr/`](./docs/adr/)
