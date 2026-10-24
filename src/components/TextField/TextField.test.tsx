import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("labels the input", () => {
    render(<TextField id="device-name" label="Name" />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("describes the input with its hint and its error", () => {
    render(
      <TextField id="device-name" label="Name" hint="e.g. Boardroom 1" error="Name is required" />,
    );

    const input = screen.getByLabelText("Name");
    expect(input).toHaveAccessibleDescription("e.g. Boardroom 1 Name is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });

  it("forwards the props react-hook-form hands back", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(
      <TextField id="device-name" label="Name" name="name" onChange={onChange} onBlur={onBlur} />,
    );

    const input = screen.getByLabelText("Name");
    await user.type(input, "Berlin");
    await user.tab();

    expect(onChange).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });
});
