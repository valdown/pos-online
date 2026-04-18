"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  defaultAppSettings,
  defaultNotificationSettings,
  type AppSettings,
  type NotificationSettings,
} from "@/lib/mock-data";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { SUPABASE_SETTINGS_ROW_ID } from "@/lib/supabase/config";

const APP_SETTINGS_STORAGE_KEY = "coffee-bean-demo-app-settings";
const NOTIFICATION_SETTINGS_STORAGE_KEY = "coffee-bean-demo-notification-settings";

type DemoSettingsContextValue = {
  appSettings: AppSettings;
  notificationSettings: NotificationSettings;
  persistenceMode: "demo" | "supabase";
  setAppSettings: (settings: AppSettings) => Promise<void>;
  setNotificationSettings: (settings: NotificationSettings) => Promise<void>;
};

const DemoSettingsContext = createContext<DemoSettingsContextValue | null>(null);

function readStoredJson<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function DemoSettingsProvider({ children }: { children: React.ReactNode }) {
  const [appSettings, setAppSettingsState] = useState<AppSettings>(defaultAppSettings);
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(defaultNotificationSettings);
  const supabaseClient = getBrowserSupabaseClient();
  const persistenceMode = supabaseClient ? "supabase" : "demo";

  useEffect(() => {
    const localAppSettings = readStoredJson(APP_SETTINGS_STORAGE_KEY, defaultAppSettings);
    const localNotificationSettings = readStoredJson(NOTIFICATION_SETTINGS_STORAGE_KEY, defaultNotificationSettings);

    setAppSettingsState(localAppSettings);
    setNotificationSettingsState(localNotificationSettings);

    if (!supabaseClient) {
      return;
    }

    void (async () => {
      const [{ data: appData }, { data: notificationData }] = await Promise.all([
        supabaseClient.from("app_settings").select("*").eq("id", SUPABASE_SETTINGS_ROW_ID).maybeSingle<AppSettings & { id: string }>(),
        supabaseClient
          .from("notification_settings")
          .select("*")
          .eq("id", SUPABASE_SETTINGS_ROW_ID)
          .maybeSingle<NotificationSettings & { id: string }>(),
      ]);

      if (appData) {
        const nextAppSettings = {
          storeName: appData.storeName,
          branchName: appData.branchName,
          taxRate: appData.taxRate,
          serviceFee: appData.serviceFee,
          storePhone: appData.storePhone,
          receiptFooter: appData.receiptFooter,
          bankName: appData.bankName,
          bankAccountName: appData.bankAccountName,
          bankAccountNumber: appData.bankAccountNumber,
          openingCash: appData.openingCash,
          autoPrintReceipt: appData.autoPrintReceipt,
        } satisfies AppSettings;
        setAppSettingsState(nextAppSettings);
        window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(nextAppSettings));
      }

      if (notificationData) {
        const nextNotificationSettings = {
          telegramEnabled: notificationData.telegramEnabled,
          botToken: notificationData.botToken,
          chatId: notificationData.chatId,
          digestFrequency: notificationData.digestFrequency,
          lowStockAlert: notificationData.lowStockAlert,
          cashierSummary: notificationData.cashierSummary,
          refundAlert: notificationData.refundAlert,
        } satisfies NotificationSettings;
        setNotificationSettingsState(nextNotificationSettings);
        window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(nextNotificationSettings));
      }
    })();
  }, [supabaseClient]);

  const value = useMemo<DemoSettingsContextValue>(
    () => ({
      appSettings,
      notificationSettings,
      persistenceMode,
      setAppSettings: async (settings) => {
        setAppSettingsState(settings);
        window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        if (supabaseClient) {
          await supabaseClient.from("app_settings").upsert({ id: SUPABASE_SETTINGS_ROW_ID, ...settings });
        }
      },
      setNotificationSettings: async (settings) => {
        setNotificationSettingsState(settings);
        window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        if (supabaseClient) {
          await supabaseClient.from("notification_settings").upsert({ id: SUPABASE_SETTINGS_ROW_ID, ...settings });
        }
      },
    }),
    [appSettings, notificationSettings, persistenceMode, supabaseClient]
  );

  return <DemoSettingsContext.Provider value={value}>{children}</DemoSettingsContext.Provider>;
}

export function useDemoSettings() {
  const context = useContext(DemoSettingsContext);

  if (!context) {
    throw new Error("useDemoSettings must be used within DemoSettingsProvider");
  }

  return context;
}
