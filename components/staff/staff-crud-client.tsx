"use client";

import { createPortal } from "react-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useLoadingOverlay } from "@/components/providers/loading-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MENU_ACCESS_LEVEL_LABELS, MENU_ACCESS_LEVELS, STAFF_MENU_KEYS, STAFF_MENU_LABELS, type MenuAccessLevel, type StaffMenuKey } from "@/lib/roles";
import type { StaffListItem } from "@/lib/supabase/staff";
import type { StaffRoleOption } from "@/lib/supabase/roles";

type StaffFormValues = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  isActive: boolean;
};

const emptyPermissions = Object.fromEntries(STAFF_MENU_KEYS.map((key) => [key, "hidden"])) as Record<StaffMenuKey, MenuAccessLevel>;

const emptyForm: StaffFormValues = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  isActive: true,
};

function getRolePermissions(roleId: string, roles: StaffRoleOption[]) {
  return roles.find((role) => role.id === roleId)?.permissions ?? emptyPermissions;
}

export function StaffCrudClient({ initialStaff, initialRoles }: { initialStaff: StaffListItem[]; initialRoles: StaffRoleOption[] }) {
  const { startLoading, stopLoading } = useLoadingOverlay();
  const [staff, setStaff] = useState(initialStaff);
  const [roles, setRoles] = useState(initialRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [values, setValues] = useState<StaffFormValues>({ ...emptyForm, roleId: initialRoles[0]?.id ?? "" });
  const [permissionDraft, setPermissionDraft] = useState<Record<StaffMenuKey, MenuAccessLevel>>(initialRoles[0]?.permissions ?? emptyPermissions);
  const [isMounted, setIsMounted] = useState(false);

  const sortedStaff = useMemo(() => [...staff].sort((a, b) => a.name.localeCompare(b.name, "id")), [staff]);
  const selectedRole = useMemo(() => roles.find((role) => role.id === values.roleId) ?? null, [roles, values.roleId]);

  function resetForm(nextRoleId = roles[0]?.id ?? "") {
    setEditingStaffId(null);
    setValues({ ...emptyForm, roleId: nextRoleId });
    setPermissionDraft(getRolePermissions(nextRoleId, roles));
    setDialogOpen(false);
  }

  function updateField<K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [dialogOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startLoading();

    try {
      const payload = {
        ...values,
        rolePermissions: permissionDraft,
      };

      const response = await fetch(editingStaffId ? `/api/staff/${editingStaffId}` : "/api/staff", {
        method: editingStaffId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { error?: string; staff?: StaffListItem } | null;

      if (!response.ok || !result?.staff) {
        await stopLoading();
        toast.error(editingStaffId ? "Staf gagal diperbarui." : "Staf gagal ditambahkan.", {
          description: result?.error ?? "Periksa koneksi dan schema tabel staff.",
        });
        return;
      }

      setStaff((current) => {
        if (editingStaffId) {
          return current.map((item) => (item.id === editingStaffId ? result.staff! : item));
        }

        return [result.staff!, ...current];
      });

      if (selectedRole) {
        setRoles((current) => current.map((role) => (role.id === selectedRole.id ? { ...role, permissions: permissionDraft } : role)));
      }

      await stopLoading();
      toast.success(editingStaffId ? "Staf berhasil diperbarui." : "Staf baru berhasil ditambahkan.");
      resetForm();
    } catch (error) {
      await stopLoading();
      toast.error(editingStaffId ? "Staf gagal diperbarui." : "Staf gagal ditambahkan.", {
        description: error instanceof Error ? error.message : "Periksa koneksi dan schema tabel staff.",
      });
    }
  }

  async function handleDelete(target: StaffListItem) {
    const confirmed = window.confirm(`Nonaktifkan staf ${target.name}?`);
    if (!confirmed) return;

    startLoading();

    try {
      const response = await fetch(`/api/staff/${target.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        await stopLoading();
        toast.error("Staf gagal dinonaktifkan.", {
          description: result?.error ?? "Periksa koneksi dan schema tabel staff.",
        });
        return;
      }

      setStaff((current) => current.map((item) => (item.id === target.id ? { ...item, isActive: false, status: "Off" } : item)));
      await stopLoading();
      toast.success("Staf berhasil dinonaktifkan.");
    } catch (error) {
      await stopLoading();
      toast.error("Staf gagal dinonaktifkan.", {
        description: error instanceof Error ? error.message : "Periksa koneksi dan schema tabel staff.",
      });
    }
  }

  function openCreateDialog() {
    const firstRoleId = roles[0]?.id ?? "";
    setValues({ ...emptyForm, roleId: firstRoleId });
    setPermissionDraft(getRolePermissions(firstRoleId, roles));
    setEditingStaffId(null);
    setDialogOpen(true);
  }

  function openEditDialog(target: StaffListItem) {
    setEditingStaffId(target.id);
    setValues({
      name: target.name,
      email: target.email,
      password: "",
      roleId: target.roleId ?? roles.find((role) => role.name === target.role)?.id ?? roles[0]?.id ?? "",
      isActive: target.isActive,
    });
    const nextRoleId = target.roleId ?? roles.find((role) => role.name === target.role)?.id ?? roles[0]?.id ?? "";
    setPermissionDraft(getRolePermissions(nextRoleId, roles));
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle>Manajemen staf</CardTitle>
                <div className="inline-flex items-center rounded-[var(--radius-pill)] border border-[rgba(228,183,133,0.28)] bg-[rgba(255,248,242,0.86)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--coffee-700)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  {sortedStaff.length} user
                </div>
              </div>
              <CardDescription className="max-w-2xl leading-6">Kelola user internal, role aktif, dan level akses per menu dalam satu panel yang konsisten dengan alur operasional owner.</CardDescription>
            </div>

            <Button type="button" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Tambah User
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  <th className="pb-2 font-medium">Nama</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Akses</th>
                  <th className="pb-2 font-medium">Status Online</th>
                  <th className="pb-2 font-medium">Status Akun</th>
                  <th className="pb-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedStaff.map((member) => (
                  <tr key={member.id} className="bg-[rgba(255,255,255,0.72)] shadow-[inset_0_0_0_1px_var(--line)]">
                    <td className="rounded-l-[var(--radius-soft)] px-4 py-4">
                      <p className="font-semibold text-[var(--ink)]">{member.name}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{member.email || "-"}</td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--ink)]">{member.role}</td>
                    <td className="px-4 py-4"><Badge variant="neutral">{member.access}</Badge></td>
                    <td className="px-4 py-4">
                      <Badge variant={member.statusOnline === "Online" ? "success" : member.statusOnline === "Istirahat" ? "warning" : "neutral"}>
                        {member.statusOnline}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={member.statusAccount === "Aktif" ? "success" : "neutral"}>{member.statusAccount}</Badge>
                    </td>
                    <td className="rounded-r-[var(--radius-soft)] px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => openEditDialog(member)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => void handleDelete(member)} disabled={member.isOwner}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isMounted && dialogOpen
        ? createPortal(
            <div className="fixed inset-0 z-[170] overflow-y-auto bg-[rgb(17_24_39_/_0.8)] px-3 py-3 sm:px-4 sm:py-6">
              <div className="flex min-h-full items-start justify-center sm:items-center">
                <div className="relative my-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-[54rem] flex-col overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(250,244,238,0.99))] shadow-[0_30px_70px_rgba(17,24,39,0.24)] sm:max-h-[calc(100vh-3rem)]">
                  <div className="shrink-0 border-b border-[rgba(226,212,198,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,244,236,0.95))] px-5 py-4 sm:px-6 sm:py-5">
                    <div className="pr-12">
                      <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[1.9rem]">{editingStaffId ? "Edit User" : "Tambah User Baru"}</h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Atur data user, role, dan level akses per menu. Perubahan akses akan mengikuti role yang dipilih.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => resetForm()}
                      className="absolute right-4 top-4 rounded-full border border-[rgba(226,212,198,0.9)] bg-[var(--surface-soft)] p-2 text-[var(--muted)] transition hover:text-[var(--ink)] sm:right-5 sm:top-5"
                      aria-label="Tutup dialog user"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                          <span>Nama Lengkap</span>
                          <Input value={values.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nama lengkap" />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                          <span>Role</span>
                          <select
                            value={values.roleId}
                            onChange={(event) => {
                              const nextRoleId = event.target.value;
                              updateField("roleId", nextRoleId);
                              setPermissionDraft(getRolePermissions(nextRoleId, roles));
                            }}
                            className="h-12 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none"
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                          <span>Username / Email</span>
                          <Input value={values.email} onChange={(event) => updateField("email", event.target.value)} placeholder="username@email.com" />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                          <span>{editingStaffId ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"}</span>
                          <Input type="password" value={values.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Ketik kata sandi" />
                        </label>

                        <div className="space-y-2 md:col-span-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[var(--ink)]">Status Akun</p>
                            <p className="text-xs leading-5 text-[var(--muted)]">Pilih apakah akun ini dapat digunakan untuk login. Status operasional akan mengikuti aktivitas sesi user.</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => updateField("isActive", true)}
                              aria-pressed={values.isActive}
                              className={`rounded-[var(--radius-soft)] border px-4 py-3 text-left transition ${
                                values.isActive
                                  ? "border-[var(--coffee-300)] bg-[rgba(255,248,242,0.95)] shadow-[0_16px_28px_rgba(122,75,44,0.1)]"
                                  : "border-[var(--line)] bg-[rgba(255,255,255,0.78)] hover:border-[var(--coffee-300)] hover:bg-[var(--surface-soft)]"
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span className={`size-3 rounded-full ${values.isActive ? "bg-[var(--success)]" : "bg-[var(--sand-300)]"}`} />
                                <span className="text-sm font-semibold text-[var(--ink)]">Aktif</span>
                              </span>
                              <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">User dapat login dan menggunakan akses menu sesuai role.</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateField("isActive", false)}
                              aria-pressed={!values.isActive}
                              className={`rounded-[var(--radius-soft)] border px-4 py-3 text-left transition ${
                                !values.isActive
                                  ? "border-[var(--coffee-300)] bg-[rgba(255,248,242,0.95)] shadow-[0_16px_28px_rgba(122,75,44,0.1)]"
                                  : "border-[var(--line)] bg-[rgba(255,255,255,0.78)] hover:border-[var(--coffee-300)] hover:bg-[var(--surface-soft)]"
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span className={`size-3 rounded-full ${!values.isActive ? "bg-[var(--coffee-600)]" : "bg-[var(--sand-300)]"}`} />
                                <span className="text-sm font-semibold text-[var(--ink)]">Nonaktif</span>
                              </span>
                              <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">Akun disimpan tetapi tidak bisa dipakai login sampai diaktifkan kembali.</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-[var(--radius-soft)] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--coffee-700)]">Level Akses Per Menu</p>
                          <p className="text-sm text-[var(--muted)]">Perubahan di bawah ini akan memperbarui role <span className="font-semibold text-[var(--ink)]">{selectedRole?.name ?? "-"}</span> dan berlaku untuk semua user dengan role tersebut.</p>
                        </div>
                        <div className="space-y-3 pt-2">
                          {STAFF_MENU_KEYS.map((menuKey) => (
                            <div key={menuKey} className="grid items-center gap-3 rounded-[var(--radius-soft)] border border-[rgba(226,212,198,0.88)] bg-[var(--surface-soft)] px-4 py-3 md:grid-cols-[minmax(0,1fr)_14rem]">
                              <p className="text-sm font-semibold text-[var(--ink)]">{STAFF_MENU_LABELS[menuKey]}</p>
                              <select
                                value={permissionDraft[menuKey]}
                                onChange={(event) => setPermissionDraft((current) => ({ ...current, [menuKey]: event.target.value as MenuAccessLevel }))}
                                className="h-12 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none"
                              >
                                {MENU_ACCESS_LEVELS.map((level) => (
                                  <option key={level} value={level}>
                                    {MENU_ACCESS_LEVEL_LABELS[level]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-[rgba(226,212,198,0.9)] bg-[linear-gradient(180deg,rgba(255,250,246,0.94),rgba(255,255,255,0.98))] px-5 py-4 sm:px-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button type="button" variant="outline" onClick={() => resetForm()}>
                          Batal
                        </Button>
                        <Button type="submit">{editingStaffId ? "Simpan Perubahan" : "Simpan User"}</Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
