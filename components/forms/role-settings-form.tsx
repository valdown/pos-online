"use client";

import { Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useLoadingOverlay } from "@/components/providers/loading-overlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_STAFF_ROLES, normalizeStaffRoles, slugifyRoleId } from "@/lib/roles";
import type { StaffRoleOption } from "@/lib/supabase/roles";

const ROLE_STORAGE_KEY = "coffee-bean-local-staff-roles";

type RolePersistenceMode = "local" | "supabase" | "supabase-fallback";

function readStoredRoles() {
  if (typeof window === "undefined") {
    return [...DEFAULT_STAFF_ROLES];
  }

  const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);

  if (!raw) {
    return [...DEFAULT_STAFF_ROLES];
  }

  try {
    return normalizeStaffRoles(JSON.parse(raw));
  } catch {
    return [...DEFAULT_STAFF_ROLES];
  }
}

function buildRoleBadge(roleName: string) {
  switch (roleName.toLowerCase()) {
    case "owner":
      return "Akses penuh";
    case "kasir":
      return "Operasional kasir";
    case "supervisor":
      return "Kontrol shift";
    default:
      return "Role tambahan";
  }
}

function createRoleSummary(roleName: string) {
  return `Peran ${roleName} siap dipakai sebagai master role untuk hak akses pengguna di outlet.`;
}

function buildRoleItem(roleName: string) {
  return {
    id: slugifyRoleId(roleName),
    name: roleName,
    summary: createRoleSummary(roleName),
    badge: buildRoleBadge(roleName),
  };
}

export function RoleSettingsForm() {
  const { startLoading, stopLoading } = useLoadingOverlay();
  const [roles, setRoles] = useState<string[]>([...DEFAULT_STAFF_ROLES]);
  const [newRole, setNewRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<RolePersistenceMode>("local");

  const roleItems = useMemo(() => roles.map(buildRoleItem), [roles]);
  const normalizedRoleNames = useMemo(() => roles.map((role) => role.toLowerCase()), [roles]);

  useEffect(() => {
    const localRoles = readStoredRoles();
    setRoles(localRoles);
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(localRoles));

    void (async () => {
      const response = await fetch("/api/staff/roles", { cache: "no-store" }).catch(() => null);

      if (!response?.ok) {
        setPersistenceMode("supabase-fallback");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { roles?: StaffRoleOption[] } | null;

      if (payload?.roles?.length) {
        const nextRoles = payload.roles.map((role) => role.name);
        setRoles(nextRoles);
        window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(nextRoles));
        setPersistenceMode("supabase");
        return;
      }

      setPersistenceMode("supabase-fallback");
    })();
  }, []);

  async function saveRoles(nextRoles: string[]) {
    const normalizedRoles = normalizeStaffRoles(nextRoles);

    setSubmitting(true);
    startLoading();

    try {
      setRoles(normalizedRoles);
      window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(normalizedRoles));

      const response = await fetch("/api/staff/roles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roles: normalizedRoles }),
      }).catch(() => null);

      if (!response?.ok) {
        const payload = (await response?.json().catch(() => null)) as { error?: string } | null;
        setPersistenceMode("supabase-fallback");
        throw new Error(payload?.error || "Gagal menyimpan master role ke Supabase.");
      }

      setPersistenceMode("supabase");

      await stopLoading();
      return normalizedRoles;
    } catch (error) {
      await stopLoading();
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedRole = newRole.trim();

    if (!trimmedRole) {
      return;
    }

    if (normalizedRoleNames.includes(trimmedRole.toLowerCase())) {
      toast.warning("Role sudah tersedia.", {
        description: "Gunakan nama role lain agar master data tidak duplikat.",
      });
      return;
    }

    try {
      const nextRoles = await saveRoles([...roles, trimmedRole]);
      setNewRole("");
      toast.success("Role ditambahkan.", {
        description:
          persistenceMode === "supabase"
            ? `${trimmedRole} masuk ke master role dan tersimpan ke Supabase.`
            : persistenceMode === "supabase-fallback"
              ? `${trimmedRole} disimpan lokal sementara karena Supabase sedang fallback.`
              : `${trimmedRole} disimpan lokal sebagai master role di browser ini.`,
      });
      setRoles(nextRoles);
    } catch (error) {
      toast.error("Role gagal ditambahkan.", {
        description: error instanceof Error ? error.message : "Periksa koneksi Supabase dan schema tabel staff_roles.",
      });
    }
  }

  async function handleRemoveRole(roleId: string) {
    if (roles.length <= 1) {
      toast.warning("Minimal satu role harus tersedia.", {
        description: "Sisakan minimal satu role agar konfigurasi akses tetap punya master dasar.",
      });
      return;
    }

    const roleToRemove = roleItems.find((role) => role.id === roleId);

    try {
      const nextRoles = await saveRoles(roles.filter((role) => slugifyRoleId(role) !== roleId));
      setRoles(nextRoles);

      if (roleToRemove) {
        toast.success("Role dihapus.", {
          description:
            persistenceMode === "supabase"
              ? `${roleToRemove.name} dikeluarkan dari master role dan sinkron ke Supabase.`
              : persistenceMode === "supabase-fallback"
                ? `${roleToRemove.name} dihapus lokal sementara karena Supabase sedang fallback.`
                : `${roleToRemove.name} dikeluarkan dari master role lokal di browser ini.`,
        });
      }
    } catch (error) {
      toast.error("Role gagal dihapus.", {
        description: error instanceof Error ? error.message : "Periksa koneksi Supabase dan schema tabel staff_roles.",
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Konfigurasi role</CardTitle>
          <CardDescription>Kelola master role untuk membentuk daftar peran yang nantinya bisa dipakai saat mengatur akses pengguna.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-[var(--radius-soft)] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--coffee-700)]">Master role aktif</p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{roleItems.length}</p>
                  <p className="pb-1 text-sm text-[var(--muted)]">role siap dipetakan ke user dan alur approval.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coffee-700)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <ShieldCheck className="size-3.5" />
                {persistenceMode === "supabase" ? "Tersinkron ke Supabase" : persistenceMode === "supabase-fallback" ? "Fallback lokal aktif" : "Penyimpanan lokal"}
              </div>
            </div>
          </div>

          <form onSubmit={handleAddRole} className="flex flex-wrap gap-3">
            <Input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="Tambah role baru" className="max-w-sm" />
            <Button type="submit" disabled={!newRole.trim() || submitting}>
              <Plus className="size-4" />
              Tambah Role
            </Button>
          </form>

          <div className="space-y-3">
            {roleItems.map((role) => (
              <div key={role.id} className="rounded-[var(--radius-soft)] border border-[var(--line)] bg-white/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)]">{role.name}</p>
                      <span className="rounded-[var(--radius-pill)] bg-[var(--surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--coffee-700)]">
                        {role.badge}
                      </span>
                    </div>
                    <p className="max-w-xl text-sm text-[var(--muted)]">{role.summary}</p>
                  </div>

                  <Button type="button" variant="outline" size="sm" onClick={() => void handleRemoveRole(role.id)} disabled={submitting}>
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Preview role aktif</CardTitle>
          <CardDescription>Daftar ini memberi gambaran cepat role yang sedang tersedia sebelum dihubungkan ke master pengguna.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {roleItems.map((role) => (
            <div key={`${role.id}-preview`} className="flex items-start justify-between gap-4 rounded-[var(--radius-soft)] bg-[var(--surface-soft)] px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-[var(--radius-soft)] bg-white text-[var(--coffee-700)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <UserCog className="size-4.5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--ink)]">{role.name}</p>
                  <p className="text-sm text-[var(--muted)]">{role.summary}</p>
                </div>
              </div>

              <span className="pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coffee-700)]">Aktif</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
