export const DEMO_SESSION_COOKIE = "coffee-demo-session";

export const DEMO_CREDENTIALS = {
  username: "owner",
  password: "coffeebean",
} as const;

export type AppShellUser = {
  initials: string;
  name: string;
  role: string;
  subtitle: string;
  modeLabel: "Demo" | "Supabase";
};

export const DEMO_APP_USER: AppShellUser = {
  initials: "AN",
  name: "Aa Nden",
  role: "Owner",
  subtitle: "coffee-bean.local",
  modeLabel: "Demo",
};
