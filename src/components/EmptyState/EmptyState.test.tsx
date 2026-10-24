import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("announces that there is nothing to show", () => {
    render(<EmptyState title="No devices match your search" description="Try a different name." />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("No devices match your search");
    expect(status).toHaveTextContent("Try a different name.");
  });
});
