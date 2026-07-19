import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { allowedBuildings } from "@/lib/permissions";
import {
  baht,
  calcInvoice,
  overdueInfo,
  roomLabel,
  thaiDate,
  thaiMonth,
} from "@/lib/format";
import PrintButton from "./PrintButton";

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await currentUser();

  const inv = await db.invoice.findUnique({
    where: { id },
    include: { room: true, tenant: true, items: true },
  });
  if (!inv) notFound();

  // กันพิมพ์บิลของห้องในอาคารที่ไม่มีสิทธิ์
  const allowed = allowedBuildings(user?.role ?? "staff", user?.buildingAccess);
  if (allowed && !allowed.includes(inv.room.building)) notFound();

  const c = calcInvoice(inv);
  const od = overdueInfo(inv, user?.lateFeePerDay ?? 0);
  const grandTotal = c.total + od.lateFee;

  // โหมดใบเสร็จรับเงิน — เฉพาะบิลที่ชำระแล้วเท่านั้น
  const isReceipt = sp.type === "receipt" && inv.status === "paid";
  const docTitle = isReceipt ? "ใบเสร็จรับเงิน" : "ใบแจ้งค่าเช่า";

  const lines: { label: string; value: number }[] = [
    { label: "ค่าเช่าห้อง", value: c.rent },
    {
      label: `ค่าน้ำ ${c.waterUnits} หน่วย × ${inv.waterRate}${inv.waterMeterChanged ? " (เปลี่ยนมิเตอร์)" : ""}`,
      value: c.waterCost,
    },
    {
      label: `ค่าไฟ ${c.elecUnits} หน่วย × ${inv.elecRate}${inv.elecMeterChanged ? " (เปลี่ยนมิเตอร์)" : ""}`,
      value: c.elecCost,
    },
    ...inv.items.map((it) => ({ label: it.label, value: it.amount })),
    ...(od.overdue && od.lateFee > 0
      ? [{ label: `ค่าปรับล่าช้า ${od.daysLate} วัน`, value: od.lateFee }]
      : []),
  ];

  return (
    <div className="max-w-xl mx-auto">
      <PrintButton
        backHref={`/invoices?room=${inv.roomId}&period=${inv.period}`}
        label={isReceipt ? "พิมพ์ใบเสร็จรับเงิน" : "พิมพ์ใบแจ้งหนี้"}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-8 print:border-0 print:rounded-none">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="text-xl font-bold text-slate-800">
              {user?.dormName}
            </div>
            <div className="text-sm text-slate-500 mt-1">{docTitle}</div>
            {user?.address && (
              <div className="text-xs text-slate-400 mt-1 whitespace-pre-line">
                {user.address}
              </div>
            )}
            {user?.taxId && (
              <div className="text-xs text-slate-400">
                เลขผู้เสียภาษี {user.taxId}
              </div>
            )}
          </div>
          <div className="text-right text-sm text-slate-500">
            <div>ประจำเดือน{thaiMonth(inv.period)}</div>
            <div>ห้อง {roomLabel(inv.room.building, inv.room.number)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="text-slate-500">ผู้เช่า</div>
          <div className="text-right text-slate-800">
            {inv.tenant?.name ?? "-"}
          </div>
          <div className="text-slate-500">กำหนดชำระ</div>
          <div className="text-right text-slate-800">
            {thaiDate(inv.dueDate)}
          </div>
          <div className="text-slate-500">สถานะ</div>
          <div className="text-right">
            {inv.status === "paid" ? (
              <span className="text-emerald-600 font-medium">ชำระแล้ว</span>
            ) : (
              <span className="text-red-600 font-medium">ค้างชำระ</span>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="text-left font-medium py-2">รายการ</th>
              <th className="text-right font-medium py-2">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2 text-slate-700">{l.label}</td>
                <td className="py-2 text-right text-slate-700">
                  {baht(l.value)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 font-semibold text-slate-800">
                ยอดรวมทั้งสิ้น
              </td>
              <td className="py-3 text-right text-xl font-bold text-brand-700">
                {baht(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* รายละเอียดการรับชำระ — เฉพาะใบเสร็จรับเงิน */}
        {isReceipt && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm">
            <div className="font-medium text-emerald-800 mb-1">
              รายละเอียดการรับชำระ
            </div>
            <div className="text-emerald-700">
              วันที่ชำระ {thaiDate(inv.paidDate)} · ช่องทาง{" "}
              {inv.paymentMethod ?? "ไม่ระบุ"} · ยอดที่รับชำระ{" "}
              {baht(inv.paidAmount ?? grandTotal)}
            </div>
            {inv.paymentNote && (
              <div className="text-emerald-600 text-xs mt-1">
                หมายเหตุ: {inv.paymentNote}
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-8 text-slate-600">
              <div className="text-center">
                <div className="border-t border-slate-300 pt-2 mt-6">
                  ผู้รับเงิน ({user?.name ?? "—"})
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-slate-300 pt-2 mt-6">
                  ผู้จ่ายเงิน ({inv.tenant?.name ?? "—"})
                </div>
              </div>
            </div>
          </div>
        )}

        {!isReceipt && (user?.bankName || user?.bankAccountNo) && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="font-medium text-slate-700 mb-1">ช่องทางชำระเงิน</div>
            <div className="text-slate-600">
              {user?.bankName}
              {user?.bankAccountName ? ` · ${user.bankAccountName}` : ""}
            </div>
            {user?.bankAccountNo && (
              <div className="text-slate-600">
                เลขที่บัญชี {user.bankAccountNo}
              </div>
            )}
          </div>
        )}

        {user?.billNote && (
          <div className="mt-4 text-xs text-slate-400 whitespace-pre-line">
            {user.billNote}
          </div>
        )}
      </div>
    </div>
  );
}
