import { useEffect, useState } from "react";

/**
 * Debouncing keeps the search on the server side without firing a request per
 * keystroke. The input stays controlled and responsive; the debounced value
 * drives the query and the URL change.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
