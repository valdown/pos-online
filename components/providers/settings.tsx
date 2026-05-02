"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  defaultAppSettings,
  defaultNotificationSettings,
  type AppSettings,
  type NotificationSettings,
} from "@/lib/mock-data";
import { normalizeMenuCategories } from "@/lib/menu-categories";
import { normalizePaymentMethods } from "@/lib/payment-methods";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { SUPABASE_SETTINGS_ROW_ID } from "@/lib/supabase/config";
import {
  type AppSettingsRow,
  type NotificationSettingsRow,
  mapAppSettingsModelToRow,
  mapAppSettingsRowToModel,
  mapNotificationSettingsModelToRow,
  mapNotificationSettingsRowToModel,
} from "@/lib/supabase/settings";

const APP_SETTINGS_STORAGE_KEY = "coffee-bean-local-app-settings";
const NOTIFICATION_SETTINGS_STORAGE_KEY = "coffee-bean-local-notification-settings";

export type SettingsPersistenceMode = "local" | "supabase" | "supabase-fallback";

type SettingsContextValue = {
  appSettings: AppSettings;
  notificationSettings: NotificationSettings;
  persistenceMode: SettingsPersistenceMode;
  setAppSettings: (settings: AppSettings) => Promise<void>;
  setNotificationSettings: (settings: NotificationSettings) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readStoredJson<T>(key: string, fallback: T, legacyKey?: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key) ?? (legacyKey ? window.localStorage.getItem(legacyKey) : null);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeStoredAppSettings(value: AppSettings): AppSettings {
  return {
    ...defaultAppSettings,
    ...value,
    paymentMethods: normalizePaymentMethods(value?.paymentMethods),
    menuCategories: normalizeMenuCategories(value?.menuCategories),
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [appSettings, setAppSettingsState] = useState<AppSettings>(defaultAppSettings);
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(defaultNotificationSettings);
  const supabaseClient = getBrowserSupabaseClient();
  const [persistenceMode, setPersistenceMode] = useState<SettingsPersistenceMode>(supabaseClient ? "supabase" : "local");

  useEffect(() => {
    const localAppSettings = normalizeStoredAppSettings(readStoredJson(APP_SETTINGS_STORAGE_KEY, defaultAppSettings));
    const localNotificationSettings = readStoredJson(NOTIFICATION_SETTINGS_STORAGE_KEY, defaultNotificationSettings);

    setAppSettingsState(localAppSettings);
    setNotificationSettingsState(localNotificationSettings);
    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(localAppSettings));
    window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(localNotificationSettings));

    if (!supabaseClient) {
      setPersistenceMode("local");
      return;
    }

    void (async () => {
      const [{ data: appData, error: appError }, { data: notificationData, error: notificationError }] = await Promise.all([
        supabaseClient.from("mst_app_settings").select("*").eq("id", SUPABASE_SETTINGS_ROW_ID).maybeSingle<AppSettingsRow>(),
        supabaseClient
          .from("mst_notification_settings")
          .select("*")
          .eq("id", SUPABASE_SETTINGS_ROW_ID)
          .maybeSingle<NotificationSettingsRow>(),
      ]);

      if (appError || notificationError) {
        setPersistenceMode("supabase-fallback");
        return;
      }

      if (appData) {
        const nextAppSettings = normalizeStoredAppSettings(mapAppSettingsRowToModel(appData));
        setAppSettingsState(nextAppSettings);
        window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(nextAppSettings));
      }

      if (notificationData) {
        const nextNotificationSettings = mapNotificationSettingsRowToModel(notificationData);
        setNotificationSettingsState(nextNotificationSettings);
        window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(nextNotificationSettings));
      }

      setPersistenceMode(appData && notificationData ? "supabase" : "supabase-fallback");
    })();
  }, [supabaseClient]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      appSettings,
      notificationSettings,
      persistenceMode,
      setAppSettings: async (settings) => {
        const normalizedSettings = normalizeStoredAppSettings(settings);
        setAppSettingsState(normalizedSettings);
        window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
        if (supabaseClient) {
          const { error } = await supabaseClient.from("mst_app_settings").upsert(mapAppSettingsModelToRow(normalizedSettings));

          if (error) {
            setPersistenceMode("supabase-fallback");
            throw new Error(error.message || "Gagal menyimpan app_settings ke Supabase.");
          }

          setPersistenceMode("supabase");
          return;
        }

        setPersistenceMode("local");
      },
      setNotificationSettings: async (settings) => {
        setNotificationSettingsState(settings);
        window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        if (supabaseClient) {
          const { error } = await supabaseClient.from("mst_notification_settings").upsert(mapNotificationSettingsModelToRow(settings));

          if (error) {
            setPersistenceMode("supabase-fallback");
            throw new Error(error.message || "Gagal menyimpan notification_settings ke Supabase.");
          }

          setPersistenceMode("supabase");
          return;
        }

        setPersistenceMode("local");
      },
    }),
    [appSettings, notificationSettings, persistenceMode, supabaseClient]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }

  return context;
}
