import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge tone="positive">Healthy</Badge>);

    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });
});
