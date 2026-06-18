import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const db = new PrismaClient({ adapter });

async function main() {
  const email = "demo@dorm.test";
  const passwordHash = await bcrypt.hash("123456", 10);

  await db.invoiceItem.deleteMany();
  await db.invoice.deleteMany();
  await db.vehicle.deleteMany();
  await db.tenant.deleteMany();
  await db.parcel.deleteMany();
  await db.issue.deleteMany();
  await db.booking.deleteMany();
  await db.asset.deleteMany();
  await db.transaction.deleteMany();
  await db.servicePreset.deleteMany();
  await db.staff.deleteMany();
  await db.room.deleteMany();
  await db.user.deleteMany();

  await db.user.create({
    data: {
      email,
      passwordHash,
      name: "คุณสมชาย",
      role: "admin",
      dormName: "บ้านสวนเรสซิเดนซ์",
      waterRate: 18,
      elecRate: 8,
      businessType: "บุคคลธรรมดา",
      taxId: "1234567890123",
      address: "99/1 ถ.สุขุมวิท ต.ในเมือง อ.เมือง จ.เชียงใหม่ 50000",
      billNote: "ชำระภายในวันที่ 5 ของทุกเดือน ขอบคุณที่ชำระตรงเวลาค่ะ",
      bankName: "ธนาคารกสิกรไทย",
      bankAccountName: "นายสมชาย ใจดี",
      bankAccountNo: "123-4-56789-0",
      lateFeePerDay: 20,
    },
  });

  // รายการบริการที่ใช้บ่อย
  await db.servicePreset.createMany({
    data: [
      { label: "ค่าที่จอดรถ", amount: 300 },
      { label: "ค่าส่วนกลาง", amount: 150 },
      { label: "ค่าอินเทอร์เน็ต", amount: 200 },
    ],
  });

  // พนักงาน
  await db.staff.createMany({
    data: [
      { name: "สมศรี ผู้จัดการ", role: "manager", phone: "0810000001", email: "manager@dorm.test" },
      { name: "อาทิตย์ ดูแลตึก", role: "staff", phone: "0810000002" },
      { name: "ป้าสมจิตร แม่บ้าน", role: "staff", phone: "0810000003" },
    ],
  });

  // สร้างห้อง 2 อาคาร (A=ชั้น1, B=ชั้น2) ชั้นละ 4 ห้อง
  const roomNames = [
    "ห้องริมระเบียง",
    "ห้องมุม",
    "ห้องวิวสวน",
    "ห้องพิเศษราคาประหยัดสุดคุ้ม",
  ];
  const rooms: { id: string; number: string; floor: number; basePrice: number }[] =
    [];
  for (let floor = 1; floor <= 2; floor++) {
    for (let n = 1; n <= 4; n++) {
      const number = `${floor}0${n}`;
      const room = await db.room.create({
        data: {
          building: floor === 1 ? "A" : "B",
          number,
          name: n === 4 ? roomNames[3] : roomNames[n - 1],
          sortOrder: n,
          floor,
          type: n % 2 === 0 ? "ห้องแอร์" : "ห้องพัดลม",
          basePrice: n % 2 === 0 ? 4500 : 3200,
        },
      });
      rooms.push(room);
    }
  }

  // ใส่ผู้เช่าใน 5 ห้องแรก
  const names = ["มานี ใจดี", "ปิติ ตั้งใจ", "ชูใจ รักเรียน", "วีระ กล้าหาญ", "สมหญิง งามตา"];
  const occupied = rooms.slice(0, 5);
  for (let i = 0; i < occupied.length; i++) {
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    // ห้องที่ i % 2 มีสัญญาใกล้หมด (ภายใน 20 วัน) เพื่อโชว์การแจ้งเตือน
    const contractEnd = i === 4 ? new Date(Date.now() + 20 * 86400000) : end;

    const tenant = await db.tenant.create({
      data: {
        name: names[i],
        phone: `08${i}1234567`,
        idCard: `1${i}0000000000${i}`,
        vehiclePlate: i % 2 === 0 ? `กข ${1000 + i}` : null,
        roomId: occupied[i].id,
        deposit: occupied[i].basePrice,
        moveInDate: start,
        contractStart: start,
        contractEnd,
      },
    });

    // ลงทะเบียนรถให้ผู้เช่าบางคน
    if (i % 2 === 0) {
      await db.vehicle.create({
        data: {
          plate: `กข ${1000 + i}`,
          kind: i === 0 ? "car" : "motorcycle",
          brand: i === 0 ? "Toyota Vios" : "Honda Wave",
          color: i === 0 ? "ขาว" : "แดง",
          roomId: occupied[i].id,
          tenantId: tenant.id,
        },
      });
    }

    // ลิงก์พอร์ทัลผู้เช่า
    await db.room.update({
      where: { id: occupied[i].id },
      data: { publicToken: `demo-portal-${occupied[i].number}` },
    });

    // ออกบิลเดือนปัจจุบัน — บางห้องเกินกำหนด
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const paid = i < 2;
    const dueDate = paid
      ? new Date(now.getFullYear(), now.getMonth(), 5)
      : new Date(Date.now() - (i === 4 ? 8 : 2) * 86400000); // ห้องท้าย ๆ เกินกำหนด

    const inv = await db.invoice.create({
      data: {
        roomId: occupied[i].id,
        tenantId: tenant.id,
        period,
        rent: occupied[i].basePrice,
        prevWater: 100,
        currWater: 100 + 5 + i,
        prevElec: 2000,
        currElec: 2000 + 80 + i * 10,
        waterRate: 18,
        elecRate: 8,
        dueDate,
        status: paid ? "paid" : "unpaid",
        paidDate: paid ? new Date() : null,
      },
    });

    // ใส่รายการเพิ่มเติมในบิลห้องที่มีรถ
    if (i % 2 === 0) {
      await db.invoiceItem.create({
        data: { invoiceId: inv.id, label: "ค่าที่จอดรถ", amount: 300 },
      });
    }
  }

  // ===== ข้อมูลตัวอย่างฟีเจอร์ Phase 2/3 =====
  const roomByNo = (no: string) => rooms.find((r) => r.number === no)!;

  // รายรับ-รายจ่าย ย้อนหลัง 3 เดือน
  const txData: {
    type: string;
    category: string;
    amount: number;
    monthsAgo: number;
    note?: string;
  }[] = [
    { type: "income", category: "ค่าเช่า", amount: 18400, monthsAgo: 0, note: "เก็บค่าเช่าเดือนนี้" },
    { type: "income", category: "ค่าเช่า", amount: 19200, monthsAgo: 1 },
    { type: "income", category: "ค่าเช่า", amount: 17800, monthsAgo: 2 },
    { type: "expense", category: "ค่าน้ำ-ไฟส่วนกลาง", amount: 3200, monthsAgo: 0 },
    { type: "expense", category: "เงินเดือนพนักงาน", amount: 9000, monthsAgo: 0 },
    { type: "expense", category: "ซ่อมบำรุง", amount: 2500, monthsAgo: 1, note: "ซ่อมปั๊มน้ำ" },
    { type: "expense", category: "ค่าทำความสะอาด", amount: 1500, monthsAgo: 2 },
  ];
  for (const t of txData) {
    const d = new Date();
    d.setMonth(d.getMonth() - t.monthsAgo);
    await db.transaction.create({
      data: {
        type: t.type,
        category: t.category,
        amount: t.amount,
        date: d,
        note: t.note ?? null,
      },
    });
  }

  // พัสดุ
  await db.parcel.createMany({
    data: [
      { recipient: "มานี ใจดี", carrier: "Flash", roomId: roomByNo("101").id, pickedUp: false },
      { recipient: "ปิติ ตั้งใจ", carrier: "Kerry", roomId: roomByNo("102").id, pickedUp: false },
      { recipient: "ชูใจ รักเรียน", carrier: "ไปรษณีย์ไทย", roomId: roomByNo("103").id, pickedUp: true, pickedUpAt: new Date() },
    ],
  });

  // แจ้งซ่อม
  await db.issue.createMany({
    data: [
      { title: "แอร์ไม่เย็น", detail: "ห้องนอน เปิดแล้วไม่เย็น", priority: "high", status: "open", roomId: roomByNo("102").id },
      { title: "ไฟทางเดินชั้น 2 ดับ", priority: "normal", status: "in_progress", roomId: roomByNo("201").id },
      { title: "ก๊อกน้ำรั่ว", detail: "ห้องน้ำ", priority: "low", status: "done", roomId: roomByNo("101").id, resolvedAt: new Date() },
    ],
  });

  // การจอง
  await db.booking.createMany({
    data: [
      { name: "ธนา สนใจเช่า", phone: "0891112222", status: "pending", deposit: 0, roomId: roomByNo("202").id, note: "นัดชมห้องเสาร์นี้" },
      { name: "ลัดดา จองแล้ว", phone: "0893334444", status: "confirmed", deposit: 3000, roomId: roomByNo("203").id },
    ],
  });

  // ทรัพย์สิน
  await db.asset.createMany({
    data: [
      { name: "เครื่องซักผ้าหยอดเหรียญ", category: "เครื่องใช้ไฟฟ้า", quantity: 2, condition: "good" },
      { name: "เตียงนอน 3.5 ฟุต", category: "เฟอร์นิเจอร์", quantity: 8, condition: "good", roomId: roomByNo("101").id },
      { name: "เครื่องปรับอากาศ", category: "เครื่องใช้ไฟฟ้า", quantity: 1, condition: "fair", roomId: roomByNo("102").id },
      { name: "ตู้เสื้อผ้า", category: "เฟอร์นิเจอร์", quantity: 1, condition: "broken", roomId: roomByNo("104").id },
    ],
  });

  console.log("Seed เสร็จแล้ว → เข้าระบบด้วย demo@dorm.test / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
