import type { DeviceStatus } from "../../../shared/schemas/device";

export interface StatusMetaItem {
  key: DeviceStatus;
  label: string;
  color: string;
  bgColor: string;
}

export const STATUS_SEGMENTS: readonly StatusMetaItem[] = [
  {
    key: "online",
    label: "Online",
    color: "var(--status-online-fg)",
    bgColor: "var(--status-online-bg)",
  },
  {
    key: "inMeeting",
    label: "In meeting",
    color: "var(--status-inmeeting-fg)",
    bgColor: "var(--status-inmeeting-bg)",
  },
  {
    key: "offline",
    label: "Offline",
    color: "var(--status-offline-fg)",
    bgColor: "var(--status-offline-bg)",
  },
  {
    key: "deactivated",
    label: "Deactivated",
    color: "var(--status-deactivated-fg)",
    bgColor: "var(--status-deactivated-bg)",
  },
] as const;

export const STATUS_META: Record<DeviceStatus, StatusMetaItem> = {
  online: STATUS_SEGMENTS[0]!,
  inMeeting: STATUS_SEGMENTS[1]!,
  offline: STATUS_SEGMENTS[2]!,
  deactivated: STATUS_SEGMENTS[3]!,
};
