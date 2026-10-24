import { useMemo, useState } from "react";
import type { Device, DeviceStatus } from "../../../../shared/schemas/device";
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

export interface DeviceTableSectionProps {
  query: string;
  status: DeviceStatus | typeof ALL;
  mutations: DeviceMutations;
  onEdit: (device: Device) => void;
}

export function DeviceTableSection({ query, status, mutations, onEdit }: DeviceTableSectionProps) {
  const { data: devices } = useDevicesQuery();
  const [sorting, setSorting] = useState<DataTableSort[]>([{ id: "name", desc: false }]);
  const [pagination, setPagination] = useState<DataTablePagination>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [pendingDelete, setPendingDelete] = useState<Device | null>(null);

  // The status filter is a dimension of its own; the name filter is handled by
  // the table's own global filter.
  const visibleDevices = useMemo(
    () => (status === ALL ? devices : devices.filter((device) => device.status === status)),
    [devices, status],
  );

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
        caption={`Devices in the fleet — ${visibleDevices.length} shown before the name filter.`}
        columns={columns}
        data={visibleDevices}
        getRowId={(device) => device.id}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        globalFilter={query}
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
