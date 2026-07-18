import { redirect } from "next/navigation";

// หน้าแรก = ห้องพัก (ภาพรวมย้ายไป /dashboard)
export default function Home() {
  redirect("/rooms");
}
