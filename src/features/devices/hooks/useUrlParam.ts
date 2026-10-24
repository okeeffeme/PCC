import { useCallback, useMemo, useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getSearch() {
  return window.location.search;
}

/**
 * A piece of state that lives in the URL, so a filtered view can be shared or
 * restored with the back button. No router needed for a single screen.
 */
export function useUrlParam(name: string, fallback = "") {
  const search = useSyncExternalStore(subscribe, getSearch, () => "");
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const value = params.get(name) ?? fallback;

  const setValue = useCallback(
    (next: string) => {
      const current = new URLSearchParams(window.location.search);
      if (next === "" || next === fallback) {
        current.delete(name);
      } else {
        current.set(name, next);
      }
      const query = current.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [fallback, name],
  );

  return [value, setValue] as const;
}
