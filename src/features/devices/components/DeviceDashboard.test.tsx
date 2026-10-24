import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vite-plus/test";
import { DeviceDashboard } from "./DeviceDashboard";
import { renderWithProviders } from "../../../test/render";

async function renderDashboard() {
  const user = userEvent.setup();
  renderWithProviders(<DeviceDashboard />);
  // The table and the cards share the same server data; wait for the first row.
  await screen.findByRole("row", { name: /Berlin - Exec Suite 1/ }, { timeout: 5000 });
  return { user };
}

describe("DeviceDashboard", () => {
  it("summarises the fleet and lists the devices", async () => {
    await renderDashboard();

    const totalHeader = screen.getByRole("heading", { name: /Total devices/ });
    expect(within(totalHeader).getByText("4")).toBeInTheDocument();

    expect(screen.getByRole("row", { name: /Berlin - Boardroom A/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Lisbon - Focus Room 2/ })).toBeInTheDocument();
  });

  it("filters the table by name", async () => {
    const { user } = await renderDashboard();

    await user.type(screen.getByLabelText("Filter by name"), "Lisbon");

    await waitFor(
      () => {
        expect(
          screen.queryByRole("row", { name: /Berlin - Exec Suite 1/ }),
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    expect(
      await screen.findByRole("row", { name: /Lisbon - Focus Room 2/ }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it("filters the table by status from the summary cards", async () => {
    const { user } = await renderDashboard();

    const onlineCard = screen.getByRole("button", { name: /Online/ });
    await user.click(onlineCard);

    await waitFor(
      () => {
        expect(
          screen.queryByRole("row", { name: /Lisbon - Focus Room 2/ }),
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    expect(
      await screen.findByRole("row", { name: /Berlin - Exec Suite 1/ }, { timeout: 5000 }),
    ).toBeInTheDocument();

    await user.click(onlineCard);
    expect(
      await screen.findByRole("row", { name: /Lisbon - Focus Room 2/ }, { timeout: 5000 }),
    ).toBeInTheDocument();
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

    await user.click(within(dialog).getByRole("button", { name: /^Remove$/ }));

    await waitFor(() => {
      expect(screen.queryByRole("row", { name: /Berlin - Boardroom A/ })).not.toBeInTheDocument();
    });
  });
});
