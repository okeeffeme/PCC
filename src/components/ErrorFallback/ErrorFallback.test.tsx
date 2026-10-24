import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { ErrorFallback } from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("shows the error and offers a retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorFallback error={new Error("Network request failed")} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Network request failed");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
