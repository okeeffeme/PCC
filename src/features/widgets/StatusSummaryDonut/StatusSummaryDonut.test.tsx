import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { StatusSummaryDonut } from "./StatusSummaryDonut";

const summary = {
  total: 10,
  online: 5,
  inMeeting: 2,
  offline: 2,
  deactivated: 1,
};

describe("StatusSummaryDonut", () => {
  it("renders the donut chart with an accessible summary when data is present", () => {
    render(<StatusSummaryDonut summary={summary} activeStatus="all" onStatusChange={vi.fn()} />);

    const chart = screen.getByRole("img");
    expect(chart).toHaveAccessibleName(
      "Fleet summary showing 10 devices: 5 online, 2 in meeting, 2 offline, 1 deactivated.",
    );
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Total devices")).toBeInTheDocument();
  });

  it("shows the active status count and 'of {total} total' in the center when filtered", () => {
    render(<StatusSummaryDonut summary={summary} activeStatus="online" onStatusChange={vi.fn()} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("of 10 total")).toBeInTheDocument();
  });

  it("renders the empty donut skeleton when total is 0", () => {
    const emptySummary = {
      total: 0,
      online: 0,
      inMeeting: 0,
      offline: 0,
      deactivated: 0,
    };

    const { container } = render(
      <StatusSummaryDonut summary={emptySummary} activeStatus="all" onStatusChange={vi.fn()} />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
