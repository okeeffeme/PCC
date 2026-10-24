import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { Dialog } from "./Dialog";

function renderDialog(onClose = vi.fn()) {
  const user = userEvent.setup();
  render(
    <Dialog open onClose={onClose} title="Remove device" description="This cannot be undone.">
      <button type="button">Confirm</button>
    </Dialog>,
  );
  return { user, onClose };
}

describe("Dialog", () => {
  it("exposes the dialog semantics", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Remove device" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("closes on Escape", async () => {
    const { user, onClose } = renderDialog();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("moves focus inside the dialog when it opens", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("returns focus to the trigger when it closes", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Remove device">
            <button type="button">Confirm</button>
          </Dialog>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });

    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps Tab inside the dialog", async () => {
    const { user } = renderDialog();

    await user.tab();
    await user.tab();
    await user.tab();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
});
