import { useMemo, useState } from "react";
import {
  PAGE_SIZES,
  type Device,
  type DeviceSort,
  type DeviceStatus,
  type SortOrder,
} from "../../../../shared/schemas/device";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableSort,
} from "../../../components/DataTable/DataTable";
import { Dialog } from "../../../components/Dialog/Dialog";
import { StatusBadge } from "../../../components/StatusBadge/StatusBadge";
import { useDevicesQuery } from "../hooks/useDevices";
import type { DeviceMutations } from "../hooks/useDeviceMutations";
import { DeviceRowActions } from "./DeviceRowActions";
import styles from "./DeviceTableSection.module.css";

const ALL = "all";

const SORT_MAP: Record<string, DeviceSort> = {
  name: "name",
  model: "model",
  status: "status",
};

export interface DeviceTableSectionProps {
  query: string;
  status: DeviceStatus | typeof ALL;
  sort: DeviceSort;
  order: SortOrder;
  onSortChange: (sort: DeviceSort, order: SortOrder) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  mutations: DeviceMutations;
  onEdit: (device: Device) => void;
}

export function DeviceTableSection({
  query,
  status,
  sort,
  order,
  onSortChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  mutations,
  onEdit,
}: DeviceTableSectionProps) {
  const { data } = useDevicesQuery({
    q: query || undefined,
    status: status === ALL ? undefined : status,
    sort,
    order,
    page,
    pageSize,
  });
  const devices = data.items;
  const [pendingDelete, setPendingDelete] = useState<Device | null>(null);

  const sorting: DataTableSort[] = [{ id: sort, desc: order === "desc" }];
  const pagination: DataTablePagination = { pageIndex: page - 1, pageSize };

  const columns = useMemo<DataTableColumn<Device>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        sortValue: (device) => device.name,
        filterable: true,
        cell: (device) => <span className={styles.name}>{device.name}</span>,
      },
      {
        id: "model",
        header: "Model",
        sortValue: (device) => device.model,
        cell: (device) => device.model,
      },
      {
        id: "status",
        header: "Status",
        sortValue: (device) => device.status,
        cell: (device) => <StatusBadge status={device.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (device) => (
          <DeviceRowActions
            device={device}
            onEdit={() => onEdit(device)}
            onDelete={() => setPendingDelete(device)}
          />
        ),
      },
    ],
    [onEdit],
  );

  return (
    <div className={styles.section}>
      <DataTable
        caption={`Devices in the fleet — ${data.total} matches, showing ${devices.length} on this page.`}
        columns={columns}
        data={devices}
        getRowId={(device) => device.id}
        sorting={sorting}
        onSortingChange={(updater) => {
          const next = typeof updater === "function" ? updater(sorting) : updater;
          const first = next[0];
          if (!first) return;
          const nextSort = SORT_MAP[first.id];
          if (!nextSort) return;
          const nextOrder: SortOrder = first.desc ? "desc" : "asc";
          if (nextSort === sort && nextOrder === order) return;
          onSortChange(nextSort, nextOrder);
        }}
        pagination={pagination}
        onPaginationChange={(updater) => {
          const next = typeof updater === "function" ? updater(pagination) : updater;
          if (next.pageIndex !== pagination.pageIndex) {
            onPageChange(next.pageIndex + 1);
            return;
          }
          if (next.pageSize !== pagination.pageSize) {
            onPageSizeChange(next.pageSize);
          }
        }}
        globalFilter={query}
        manualSorting
        manualPagination
        rowCount={data.total}
        pageSizeOptions={[...PAGE_SIZES]}
      />

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Remove device"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be removed from the fleet. This cannot be undone.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              className={styles.confirmCancel}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmDelete}
              disabled={mutations.remove.isPending}
              onClick={() => {
                const target = pendingDelete;
                if (!target) return;
                mutations.remove.mutate(target.id, {
                  onSettled: () => setPendingDelete(null),
                });
              }}
            >
              {mutations.remove.isPending ? "Removing…" : "Remove device"}
            </button>
          </>
        }
      >
        {mutations.remove.isError ? (
          <p className={styles.formError} role="alert">
            {mutations.remove.error instanceof Error
              ? mutations.remove.error.message
              : "The device could not be removed."}
          </p>
        ) : (
          <p className={styles.dialogBody}>
            This removes the device from the fleet list and the summary counts.
          </p>
        )}
      </Dialog>
    </div>
  );
}
