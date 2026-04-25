import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getStaffMembers } from "@/lib/supabase/data";

export default async function StaffPage() {
  const staffMembers = await getStaffMembers();

  return (
    <>
      <PageHeader
        eyebrow="Team visibility"
        title="Staf"
        description="Pantau roster, akses sistem, dan status tiap anggota tim dalam tampilan yang mudah dipindai."
        actions={<CurrentTimeDisplay />}
      />

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Manajemen staf</CardTitle>
          <CardDescription>Role dan akses dibedakan jelas agar owner cepat mengecek kesiapan tim di lantai operasional.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  <th className="pb-2 font-medium">Nama</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Akses</th>
                  <th className="pb-2 font-medium">Shift</th>
                  <th className="pb-2 font-medium">Telepon</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((member) => (
                  <tr key={member.id} className="bg-[rgba(255,255,255,0.72)] shadow-[inset_0_0_0_1px_var(--line)]">
                    <td className="rounded-l-[var(--radius-soft)] px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">{member.name}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--ink)]">{member.role}</td>
                    <td className="px-4 py-4"><Badge variant="neutral">{member.access}</Badge></td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{member.shift}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{member.phone}</td>
                    <td className="rounded-r-[var(--radius-soft)] px-4 py-4">
                      <Badge variant={member.status === "Online" ? "success" : member.status === "Istirahat" ? "warning" : "neutral"}>{member.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
