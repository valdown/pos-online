"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useLoadingOverlay } from "@/components/providers/loading-overlay";

const LOGIN_SUCCESS_FLAG = "coffee-bean-login-success";

export function markLoginSuccessRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(LOGIN_SUCCESS_FLAG, "1");
}

export function LoginSuccessFeedback() {
  const { stopLoading } = useLoadingOverlay();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const shouldShowFeedback = window.sessionStorage.getItem(LOGIN_SUCCESS_FLAG) === "1";

    if (!shouldShowFeedback) {
      return;
    }

    window.sessionStorage.removeItem(LOGIN_SUCCESS_FLAG);

    void (async () => {
      await stopLoading();
      toast.success("Login internal berhasil.", {
        description: "Session owner aktif dan dashboard siap dipakai.",
      });
    })();
  }, [stopLoading]);

  return null;
}
