import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { StaffCrudClient } from "@/components/staff/staff-crud-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getStaffManagementData } from "@/lib/supabase/staff-data";

export default async function StaffPage() {
  let staffData: Awaited<ReturnType<typeof getStaffManagementData>> | null = null;
  let staffError: string | null = null;

  try {
    staffData = await getStaffManagementData();
  } catch (error) {
    staffError = error instanceof Error ? error.message : "Gagal memuat data staf.";
  }

  return (
    <>
      <PageHeader
        eyebrow="Team visibility"
        title="Staf"
        description="Pantau roster, akses sistem, dan status tiap anggota tim dalam tampilan yang mudah dipindai."
        actions={<CurrentTimeDisplay />}
      />

      {staffData ? (
        <StaffCrudClient initialStaff={staffData.staff} initialRoles={staffData.roles} />
      ) : (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Data staf belum bisa dimuat</CardTitle>
            <CardDescription>Halaman staf tidak menemukan data yang valid dari database aktif.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[var(--radius-soft)] border border-[rgba(198,122,63,0.18)] bg-[rgba(255,248,242,0.82)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              {staffError ?? "Periksa schema tabel staff di Supabase lalu muat ulang halaman ini."}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
