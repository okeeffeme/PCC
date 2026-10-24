import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderWithProviders } from "../../../test/render";
import { SummarySection } from "./SummarySection";

const summary = {
  total: 4,
  online: 1,
  inMeeting: 1,
  offline: 1,
  deactivated: 1,
};

describe("SummarySection", () => {
  it("renders Total devices as a heading rather than a card button", async () => {
    renderWithProviders(
      <SummarySection
        activeStatus="all"
        onStatusChange={vi.fn()}
        query=""
        sort="name"
        order="asc"
        summary={summary}
      />,
    );

    await waitFor(() => {
      const heading = screen.getByRole("heading", { name: /Total devices/ });
      expect(within(heading).getByText("4")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /Total devices/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("toggles a status card on click and clears the filter when clicked while active", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    const { rerender } = renderWithProviders(
      <SummarySection
        activeStatus="all"
        onStatusChange={onStatusChange}
        query=""
        sort="name"
        order="asc"
        summary={summary}
      />,
    );

    const onlineCard = await screen.findByRole("button", { name: /Online/ });
    expect(onlineCard).toHaveAttribute("aria-pressed", "false");

    await user.click(onlineCard);
    expect(onStatusChange).toHaveBeenCalledWith("online");

    rerender(
      <SummarySection
        activeStatus="online"
        onStatusChange={onStatusChange}
        query=""
        sort="name"
        order="asc"
        summary={summary}
      />,
    );

    const activeOnlineCard = screen.getByRole("button", { name: /Online/ });
    expect(activeOnlineCard).toHaveAttribute("aria-pressed", "true");

    await user.click(activeOnlineCard);
    expect(onStatusChange).toHaveBeenLastCalledWith("all");
  });
});
