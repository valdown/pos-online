"use client";

import { useEffect, useMemo, useState } from "react";

function formatParts(date: Date) {
  const zone = new Intl.DateTimeFormat("id-ID", {
    timeZoneName: "short",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  return {
    time: new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date),
    day: new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
    }).format(date),
    fullDate: new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
    zone: zone ?? "Lokal",
  };
}

export function CurrentTimeDisplay() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const { time, day, fullDate, zone } = useMemo(() => formatParts(now ?? new Date(0)), [now]);

  return (
    <div className="w-full min-w-0 xl:max-w-fit">
      <div className="rounded-[calc(var(--radius-soft)-0.1rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,248,242,0.8))] px-3 py-2.5 shadow-[0_14px_30px_rgba(82,49,29,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md sm:px-3.5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Waktu Sekarang</p>
            <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(198,122,63,0.14)] bg-white/55 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--coffee-700)]">
              {zone}
            </span>
          </div>

          <div className="space-y-1">
              <p className="min-w-[6.5ch] text-[1.2rem] font-medium leading-none tracking-[-0.045em] text-[var(--ink)] tabular-nums sm:text-[1.32rem]">
                {now ? time : "--.--.--"}
              </p>

              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-none text-[var(--muted)] sm:text-[11.5px]">
                <span className="font-medium capitalize text-[var(--ink)]">{now ? day : "Memuat"}</span>
                <span className="size-1 rounded-full bg-[var(--line)]" aria-hidden="true" />
                <span>{now ? fullDate : "tanggal lokal"}</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
