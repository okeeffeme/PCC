import type { ReactElement, SVGProps } from "react";
import type { DeviceStatus } from "../../../shared/schemas/device";
import { STATUS_META } from "../../features/devices/statusMeta";
import styles from "./StatusIcon.module.css";

export interface StatusIconProps extends SVGProps<SVGSVGElement> {
  status: DeviceStatus;
}

function OnlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M204-150q-57-55-90.5-129.5T80-440q0-83 31.5-156T197-723q54-54 127-85.5T480-840q83 0 156 31.5T763-723q54 54 85.5 127T880-440q0 86-33.5 161T756-150l-56-56q46-44 73-104.5T800-440q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 69 27 129t74 104l-57 57Zm113-113q-35-33-56-78.5T240-440q0-100 70-170t170-70q100 0 170 70t70 170q0 53-21 99t-56 78l-57-57q25-23 39.5-54t14.5-66q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 36 14.5 66.5T374-320l-57 57Zm106.5-120.5Q400-407 400-440t23.5-56.5Q447-520 480-520t56.5 23.5Q560-473 560-440t-23.5 56.5Q513-360 480-360t-56.5-23.5Z" />
    </svg>
  );
}

function InMeetingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M160-720h640-640ZM80-360v-360q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v360h-80v-360H160v360H80Zm40 200q0-66 47-113t113-47q8 0 15.5.5T311-317q-37 31-58.5 71T223-160H120Zm160-200q-29 0-49.5-20.5T210-430q0-29 20.5-49.5T280-500q29 0 49.5 20.5T350-430q0 29-20.5 49.5T280-360Zm4 200q14-69 68.5-114.5T480-320q73 0 127.5 45.5T676-160H284Zm196-220q-38 0-64-26t-26-64q0-38 26-64t64-26q38 0 64 26t26 64q0 38-26 64t-64 26Zm200 20q-29 0-49.5-20.5T610-430q0-29 20.5-49.5T680-500q29 0 49.5 20.5T750-430q0 29-20.5 49.5T680-360Zm57 200q-8-47-30.5-86T649-317q8-2 15.5-2.5t15.5-.5q66 0 113 47t47 113H737Z" />
    </svg>
  );
}

function OfflineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M204-150q-57-55-90.5-129.5T80-440q0-83 31.5-156T197-723q54-54 127-85.5T480-840q112 0 203 54.5T827-640h-97q-45-55-109.5-87.5T480-760q-134 0-227 93t-93 227q0 69 27 129t74 104l-57 57Zm113-113q-35-33-56-78.5T240-440q0-100 70-170t170-70q100 0 170 70t70 170q0 53-21 99t-56 78l-57-57q25-23 39.5-54t14.5-66q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 36 14.5 66.5T374-320l-57 57Zm106.5-120.5Q400-407 400-440t23.5-56.5Q447-520 480-520t56.5 23.5Q560-473 560-440t-23.5 56.5Q513-360 480-360t-56.5-23.5ZM840-160q-17 0-28.5-11.5T800-200q0-17 11.5-28.5T840-240q17 0 28.5 11.5T880-200q0 17-11.5 28.5T840-160Zm-40-160v-240h80v240h-80Z" />
    </svg>
  );
}

function DeactivatedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M791-55 325-521q-2 10-3.5 20t-1.5 21q0 36 14.5 66.5T374-360l-57 57q-35-33-56-78.5T240-480q0-28 6-54t17-49l-59-59q-21 36-32.5 76.5T160-480q0 69 27 129t74 104l-57 57q-57-55-90.5-129.5T80-480q0-62 17-117t49-103l-91-91 57-57 736 736-57 57Zm23-205-58-58q21-35 32.5-76t11.5-86q0-134-93-227t-227-93q-45 0-85.5 11.5T318-756l-58-58q48-32 103.5-49T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 61-17 116.5T814-260ZM697-377l-62-62q2-10 3.5-20t1.5-21q0-66-47-113t-113-47q-11 0-21 1.5t-20 3.5l-62-62q23-11 49-17t54-6q100 0 170 70t70 170q0 28-6 54t-17 49Z" />
    </svg>
  );
}

const ICONS: Record<DeviceStatus, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  online: OnlineIcon,
  inMeeting: InMeetingIcon,
  offline: OfflineIcon,
  deactivated: DeactivatedIcon,
};

export function StatusIcon({ status, className, style, ...props }: StatusIconProps) {
  const Icon = ICONS[status];
  const meta = STATUS_META[status];

  return (
    <Icon
      className={[styles.icon, className].filter(Boolean).join(" ")}
      style={{ color: meta.color, ...style }}
      data-status={status}
      {...props}
    />
  );
}
