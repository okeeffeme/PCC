import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { Button } from "./Button";

describe("Button", () => {
  it("is a real button with an explicit type", () => {
    render(<Button>Add device</Button>);

    const button = screen.getByRole("button", { name: "Add device" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("calls the click handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add device</Button>);

    await user.click(screen.getByRole("button", { name: "Add device" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables itself and announces the pending state while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button isLoading loadingLabel="Saving…" onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
