import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  DEVICE_MODELS,
  DEVICE_STATUSES,
  CreateDeviceSchema,
  type CreateDeviceInput,
  type Device,
  type DeviceStatus,
} from "../../../../shared/schemas/device";
import { Button } from "../../../components/Button/Button";
import { Dialog } from "../../../components/Dialog/Dialog";
import { Select } from "../../../components/Select/Select";
import { TextField } from "../../../components/TextField/TextField";
import { ApiError } from "../api/deviceApi";
import type { DeviceMutations } from "../hooks/useDeviceMutations";
import styles from "./DeviceFormDialog.module.css";

const STATUS_LABELS: Record<DeviceStatus, string> = {
  online: "Online",
  inMeeting: "In meeting",
  offline: "Offline",
  deactivated: "Deactivated",
};

export interface DeviceFormDialogProps {
  open: boolean;
  /** The device being edited; null creates a new one. */
  device: Device | null;
  onClose: () => void;
  mutations: DeviceMutations;
}

/**
 * The form is the only place fields are validated on the way in — and it uses
 * the same zod schema the server validates with, so the two can never disagree
 * about what a valid device is.
 */
export function DeviceFormDialog({ open, device, onClose, mutations }: DeviceFormDialogProps) {
  const isEditing = device !== null;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateDeviceInput>({
    resolver: zodResolver(CreateDeviceSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      model: DEVICE_MODELS[0],
      description: "",
      status: "online",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      device
        ? {
            name: device.name,
            model: device.model,
            description: device.description,
            status: device.status,
          }
        : {
            name: "",
            model: DEVICE_MODELS[0],
            description: "",
            status: "online",
          },
    );
  }, [device, open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (device) {
        await mutations.update.mutateAsync({ id: device.id, input: values });
      } else {
        await mutations.create.mutateAsync(values);
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.code === "duplicate_name") {
        setError("name", { message: error.message });
        return;
      }
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The device could not be saved. Please try again.",
      });
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit ${device.name}` : "Add a device"}
      description={
        isEditing
          ? "Update the details of this device."
          : "New devices are added to the fleet immediately."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="device-form" isLoading={isSubmitting}>
            {isEditing ? "Save changes" : "Add device"}
          </Button>
        </>
      }
    >
      <form id="device-form" className={styles.form} onSubmit={onSubmit} noValidate>
        {errors.root?.message ? (
          <p className={styles.formError} role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <TextField
          id="device-name"
          label="Name"
          hint="Where the device is, e.g. “London - Boardroom 1”"
          error={errors.name?.message}
          {...register("name")}
        />

        <Select
          id="device-model"
          label="Model"
          error={errors.model?.message}
          options={DEVICE_MODELS.map((model) => ({ value: model, label: model }))}
          {...register("model")}
        />

        <Select
          id="device-status"
          label="Status"
          error={errors.status?.message}
          options={DEVICE_STATUSES.map((status) => ({
            value: status,
            label: STATUS_LABELS[status],
          }))}
          {...register("status")}
        />

        <TextField
          id="device-description"
          label="Description"
          error={errors.description?.message}
          {...register("description")}
        />
      </form>
    </Dialog>
  );
}
