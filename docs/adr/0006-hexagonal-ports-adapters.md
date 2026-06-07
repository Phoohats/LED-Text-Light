# Hexagonal-lite: pure domain behind ports/adapters

แยกโค้ดเป็น domain (pure, ไม่มี DOM/Firebase) → app (use-cases) → infra (adapters)
โดย dependency ชี้เข้าใน: `ui → app → domain ← infra`

## เหตุผล
ผู้ใช้เลือก "single ก่อน → เพิ่ม sync ทีหลัง" การย้ายจาก localStorage → Firestore → broadcast
ต้องไม่รื้อแกนตรรกะ จึงนิยาม contract ไว้ใน `domain/ports.ts` (`PresetStore`, `ShowChannel`, `AuthGate`)
แล้วสลับ adapter เอา

## Consequences
- โดเมน (`sign.ts`, `animation.ts`) unit-test ได้โดยไม่ต้องมี browser/Firebase
- เพิ่ม indirection เล็กน้อย แลกกับการขยาย Phase 1→3 โดยไม่เจ็บตัว
