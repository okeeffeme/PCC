import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("states the status in words, not only in colour", () => {
    render(<StatusBadge status="inMeeting" />);

    expect(screen.getByText("In meeting")).toBeInTheDocument();
  });
});
