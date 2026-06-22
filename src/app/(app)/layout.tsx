import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getAlerts } from "@/lib/alerts";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { total: alertCount } = await getAlerts();

  return (
    <div className="md:flex">
      <Sidebar
        dormName={user.dormName}
        userName={user.name}
        role={user.role}
        alertCount={alertCount}
      />
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl mr-auto w-full">
        {children}
      </main>
    </div>
  );
}
