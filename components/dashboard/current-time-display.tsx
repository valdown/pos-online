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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const { time, day, fullDate, zone } = useMemo(() => formatParts(now), [now]);

  return (
    <div className="w-full min-w-0 sm:max-w-fit">
      <div className="relative overflow-hidden rounded-[var(--radius-soft)] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(255,253,251,0.96),rgba(251,244,236,0.92))] px-4 py-3 shadow-[0_16px_32px_rgba(82,49,29,0.08)] sm:px-5">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_center,rgba(228,183,133,0.22),rgba(228,183,133,0))]" />
        <div className="relative flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap sm:gap-x-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--coffee-600)]">Waktu Sekarang</p>
            <div className="mt-1 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-1">
              <p className="font-display text-3xl leading-none text-[var(--coffee-900)] sm:text-[2.35rem]">{time}</p>
              <p className="pb-0.5 text-sm font-medium text-[var(--muted)]">{zone}</p>
            </div>
          </div>
          <div className="hidden h-12 w-px shrink-0 bg-[linear-gradient(180deg,rgba(234,220,207,0),rgba(234,220,207,1),rgba(234,220,207,0))] sm:block" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold capitalize text-[var(--ink)]">{day}</p>
            <p className="text-sm text-[var(--muted)]">{fullDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
