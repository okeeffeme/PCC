import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { useMemo, type ReactNode } from "react";
import { Button } from "../Button/Button";
import { EmptyState } from "../EmptyState/EmptyState";
import styles from "./DataTable.module.css";

/**
 * The table is the one place a third-party library shapes our code. This
 * wrapper is the boundary: feature code speaks our own column/sorting/paging
 * types, and TanStack's API never leaks past this file. When the server owns
 * paging/sorting, `manual*` flags are passed through so TanStack never re-sorts
 * or re-pages the window the API already gave us.
 */

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortFns: { text: sortFn_text },
  filterFns: { includesString: filterFn_includesString },
});

export interface DataTableColumn<TData extends RowData> {
  id: string;
  header: string;
  /** Provides the value used for sorting. Omit for non-sortable columns. */
  sortValue?: (row: TData) => string | number;
  cell: (row: TData) => ReactNode;
  /** Include this column in the table-wide filter. */
  filterable?: boolean;
}

export interface DataTableSort {
  id: string;
  desc: boolean;
}

export interface DataTablePagination {
  pageIndex: number;
  pageSize: number;
}

export type DataTableSortUpdater =
  | DataTableSort[]
  | ((previous: DataTableSort[]) => DataTableSort[]);

export type DataTablePaginationUpdater =
  | DataTablePagination
  | ((previous: DataTablePagination) => DataTablePagination);

export interface DataTableProps<TData extends RowData> {
  caption: string;
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  sorting: DataTableSort[];
  onSortingChange: (updater: DataTableSortUpdater) => void;
  pagination: DataTablePagination;
  onPaginationChange: (updater: DataTablePaginationUpdater) => void;
  /** Table-wide filter value (the name search). */
  globalFilter?: string;
  /** When true, sorting and pagination come from the server. */
  manualSorting?: boolean;
  manualPagination?: boolean;
  /** Total rows on the server (required for manual pagination). */
  rowCount?: number;
  /** Available page sizes shown in a select. */
  pageSizeOptions?: number[];
}

export function DataTable<TData extends RowData>({
  caption,
  columns,
  data,
  getRowId,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  globalFilter = "",
  manualSorting = false,
  manualPagination = false,
  rowCount,
  pageSizeOptions,
}: DataTableProps<TData>) {
  const helper = createColumnHelper<typeof features, TData>();

  const tableColumns = useMemo<Array<ColumnDef<typeof features, TData, CellData>>>(
    () =>
      columns.map((column) => {
        const shared = {
          id: column.id,
          header: column.header,
          enableGlobalFilter: column.filterable ?? false,
        };
        return column.sortValue
          ? helper.accessor((row: TData) => column.sortValue!(row) as CellData, {
              ...shared,
              enableSorting: true,
              sortFn: "text",
            })
          : helper.display({ ...shared });
      }),
    [columns, helper],
  );

  const table = useTable({
    features,
    columns: tableColumns,
    data,
    getRowId: (row) => getRowId(row),
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: (updater) => onSortingChange(updater),
    onPaginationChange: (updater) => onPaginationChange(updater),
    manualSorting,
    manualPagination,
    ...(rowCount !== undefined ? { rowCount } : {}),
  });

  const pageCount = table.getPageCount();
  const pageIndex = pagination.pageIndex;
  const totalRows = manualPagination ? (rowCount ?? 0) : table.getRowCount();

  const renderCell = (row: TData, columnId: string) => {
    const column = columns.find((candidate) => candidate.id === columnId);
    return column ? column.cell(row) : null;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className={styles.caption}>{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const label =
                    columns.find((candidate) => candidate.id === header.column.id)?.header ?? "";
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"
                      }
                    >
                      {canSort ? (
                        <button
                          type="button"
                          className={styles.sortButton}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {label}
                          <span className={styles.sortIndicator} aria-hidden="true">
                            {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
                          </span>
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => (
                  <td key={cell.id}>{renderCell(row.original, cell.column.id)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalRows === 0 && globalFilter !== "" && !manualPagination ? (
        <EmptyState
          title="No devices match your search"
          description="Try a different name, or clear the search to see the whole fleet."
        />
      ) : null}

      <div className={styles.pagination}>
        <p className={styles.paginationInfo} aria-live="polite">
          {totalRows === 0
            ? "No rows"
            : `Page ${pageIndex + 1} of ${Math.max(pageCount, 1)} · ${totalRows} devices`}
        </p>
        <div className={styles.paginationControls}>
          {pageSizeOptions && pageSizeOptions.length > 0 ? (
            <label className={styles.paginationControlsWrapper}>
              <span className={styles.paginationInfo}>Rows per page</span>{" "}
              <select
                value={pagination.pageSize}
                onChange={(event) =>
                  onPaginationChange({ pageIndex: 0, pageSize: Number(event.target.value) })
                }
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
