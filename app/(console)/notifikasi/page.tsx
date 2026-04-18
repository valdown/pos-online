"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoSettings } from "@/components/providers/demo-settings";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationSettingsForm } from "@/components/forms/notification-settings-form";
import { notificationsFeed, type NotificationFeedItem } from "@/lib/mock-data";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export default function NotificationsPage() {
  const { notificationSettings, persistenceMode } = useDemoSettings();
  const [feed, setFeed] = useState<NotificationFeedItem[]>(notificationsFeed);

  useEffect(() => {
    const supabaseClient = getBrowserSupabaseClient();

    if (!supabaseClient) {
      return;
    }

    void (async () => {
      const { data } = await supabaseClient.from("notification_feed").select("*").order("sort_order", { ascending: true });

      if (data?.length) {
        setFeed(data as NotificationFeedItem[]);
      }
    })();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Telegram routing"
        title="Notifikasi"
        description={
          persistenceMode === "supabase"
            ? "Atur broadcast alert penting dan simpan konfigurasinya ke Supabase. Feed juga akan dibaca dari tabel notification_feed bila tersedia."
            : "Atur broadcast alert penting dengan form lokal yang tersimpan di browser ini untuk preview workflow notifikasi operasional."
        }
        actions={<Badge variant="success">{notificationSettings.telegramEnabled ? "Telegram tersambung" : "Telegram nonaktif"}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <NotificationSettingsForm />

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Feed notifikasi terbaru</CardTitle>
            <CardDescription>Preview pesan yang akan dilihat owner dari panel demo Telegram dan sistem internal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feed.map((item) => (
                <div key={item.id} className="rounded-[var(--radius-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                    <Badge variant={item.tone === "success" ? "success" : item.tone === "warning" ? "warning" : "neutral"}>{item.channel}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.message}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
