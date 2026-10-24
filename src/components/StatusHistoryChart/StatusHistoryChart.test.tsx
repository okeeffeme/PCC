import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { StatusHistoryChart } from "./StatusHistoryChart";

const data = [
  { period: "2025-06", online: 120, inMeeting: 40, offline: 30, deactivated: 20 },
  { period: "2025-07", online: 140, inMeeting: 45, offline: 28, deactivated: 19 },
];

describe("StatusHistoryChart", () => {
  it("describes the chart as an image with a text summary", () => {
    render(<StatusHistoryChart data={data} />);

    const chart = screen.getByRole("img");
    expect(chart).toHaveAccessibleName("Fleet status over time, from 2025-06 to 2025-07.");
  });

  it("exposes the same numbers in a table for screen-reader users", () => {
    render(<StatusHistoryChart data={data} />);

    const table = screen.getByRole("table", { name: "Fleet status by month" });
    expect(table).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "2025-07" })).toBeInTheDocument();
    expect(screen.getByText("140")).toBeInTheDocument();
  });
});
