import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { Select } from "./Select";

const options = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

describe("Select", () => {
  it("labels the select and renders the options", () => {
    render(<Select id="device-status" label="Status" options={options} />);

    const select = screen.getByLabelText("Status");
    expect(select).toBeInstanceOf(HTMLSelectElement);
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("reports the chosen value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select id="device-status" label="Status" options={options} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Status"), "offline");

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText("Status")).toHaveValue("offline");
  });
});
