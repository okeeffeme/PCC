import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vite-plus/test";
import { DeviceDashboard } from "./DeviceDashboard";
import { renderWithProviders } from "../../../test/render";

async function renderDashboard() {
  const user = userEvent.setup();
  renderWithProviders(<DeviceDashboard />);
  // The table and the cards share one cached list, so waiting for a row is
  // enough to know the whole section is ready.
  await screen.findByRole("row", { name: /Berlin - Exec Suite 1/ });
  return { user };
}

describe("DeviceDashboard", () => {
  it("summarises the fleet and lists the devices", async () => {
    await renderDashboard();

    const totalCard = screen.getByRole("button", { name: /Total devices/ });
    expect(within(totalCard).getByText("4")).toBeInTheDocument();

    expect(screen.getByRole("row", { name: /Berlin - Boardroom A/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Lisbon - Focus Room 2/ })).toBeInTheDocument();
  });

  it("filters the table by name", async () => {
    const { user } = await renderDashboard();

    await user.type(screen.getByLabelText("Filter by name"), "Lisbon");

    await waitFor(() => {
      expect(screen.queryByRole("row", { name: /Berlin - Exec Suite 1/ })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("row", { name: /Lisbon - Focus Room 2/ })).toBeInTheDocument();
  });

  it("filters the table by status from the summary cards", async () => {
    const { user } = await renderDashboard();

    await user.click(screen.getByRole("button", { name: /Online/ }));

    await waitFor(() => {
      expect(screen.queryByRole("row", { name: /Lisbon - Focus Room 2/ })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("row", { name: /Berlin - Exec Suite 1/ })).toBeInTheDocument();
  });

  it("adds a device through the form", async () => {
    const { user } = await renderDashboard();

    await user.click(screen.getByRole("button", { name: "Add device" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a device" });

    await user.type(within(dialog).getByLabelText("Name"), "Madrid - Training Room");
    await user.click(within(dialog).getByRole("button", { name: "Add device" }));

    await waitFor(() => {
      expect(screen.getByRole("row", { name: /Madrid - Training Room/ })).toBeInTheDocument();
    });
  });

  it("shows a field error when the name is already taken", async () => {
    const { user } = await renderDashboard();

    await user.click(screen.getByRole("button", { name: "Add device" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a device" });

    await user.type(within(dialog).getByLabelText("Name"), "Berlin - Exec Suite 1");
    await user.click(within(dialog).getByRole("button", { name: "Add device" }));

    expect(await within(dialog).findByText(/already exists/i)).toBeInTheDocument();
  });

  it("removes a device after confirmation", async () => {
    const { user } = await renderDashboard();

    await user.click(screen.getByRole("button", { name: /^Remove Berlin - Boardroom A/ }));
    const dialog = await screen.findByRole("dialog", { name: "Remove device" });

    await user.click(within(dialog).getByRole("button", { name: "Remove device" }));

    await waitFor(() => {
      expect(screen.queryByRole("row", { name: /Berlin - Boardroom A/ })).not.toBeInTheDocument();
    });
  });
});
