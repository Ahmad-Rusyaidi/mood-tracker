import { getMillisecondsUntilNextLocalDay, startOfDay } from "@/utils";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

function getCurrentDaySnapshot() {
  return startOfDay(new Date());
}

export function useCurrentDate() {
  const [today, setToday] = useState(() => getCurrentDaySnapshot());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const refreshToday = () => {
      setToday((current) => {
        const next = getCurrentDaySnapshot();
        return current.getTime() === next.getTime() ? current : next;
      });
    };

    const scheduleMidnightRefresh = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        refreshToday();
        scheduleMidnightRefresh();
      }, getMillisecondsUntilNextLocalDay(new Date()) + 50);
    };

    scheduleMidnightRefresh();

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshToday();
        scheduleMidnightRefresh();
      }
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      appStateSubscription.remove();
    };
  }, []);

  return today;
}
