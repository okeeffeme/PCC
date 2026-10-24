import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/Button/Button";
import styles from "./DeviceFilters.module.css";

export interface DeviceFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  onAddDevice: () => void;
}

const FilterSchema = z.object({
  query: z.string(),
});

type FilterFormValues = z.infer<typeof FilterSchema>;

/**
 * The name filter lives in the URL, so the view can be shared and survives a
 * reload. The input is controlled by RHF with debounced submission so the
 * request only goes out after the user finishes typing.
 */
export function DeviceFilters({ query, onQueryChange, onAddDevice }: DeviceFiltersProps) {
  const { register, watch, setValue } = useForm<FilterFormValues>({
    resolver: zodResolver(FilterSchema),
    defaultValues: { query },
    mode: "onChange",
  });

  const value = watch("query");

  useEffect(() => {
    setValue("query", query);
  }, [query, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== query) {
        onQueryChange(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, query, onQueryChange]);

  return (
    <div className={styles.filters}>
      <div className={styles.search}>
        <label className={styles.label} htmlFor="device-search">
          Filter by name
        </label>
        <input
          id="device-search"
          type="search"
          className={styles.input}
          placeholder="e.g. Boardroom"
          autoComplete="off"
          {...register("query")}
        />
      </div>
      <Button variant="primary" onClick={onAddDevice}>
        Add device
      </Button>
    </div>
  );
}
