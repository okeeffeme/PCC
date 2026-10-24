import type { Device, DeviceSummary } from "../../../../shared/schemas/device";

/** Counts derived from the list the table is rendering. */
export function summarizeDevices(devices: Device[]): DeviceSummary {
  const summary: DeviceSummary = {
    total: devices.length,
    online: 0,
    inMeeting: 0,
    offline: 0,
    deactivated: 0,
  };

  for (const device of devices) {
    summary[device.status] += 1;
  }

  return summary;
}
