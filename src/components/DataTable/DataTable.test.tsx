import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableSort,
} from "./DataTable";

interface Row {
  id: string;
  name: string;
  team: string;
}

const rows: Row[] = [
  { id: "1", name: "Berlin - Exec Suite 1", team: "Berlin" },
  { id: "2", name: "Lisbon - Focus Room 2", team: "Lisbon" },
  { id: "3", name: "Oslo - Meeting Room 5", team: "Oslo" },
];

const columns: DataTableColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    sortValue: (row) => row.name,
    filterable: true,
    cell: (row) => row.name,
  },
  { id: "team", header: "Team", sortValue: (row) => row.team, cell: (row) => row.team },
];

function renderTable(props: { globalFilter?: string } = {}) {
  const user = userEvent.setup();
  const sorting: DataTableSort[] = [];
  const pagination: DataTablePagination = { pageIndex: 0, pageSize: 10 };
  const onSortingChange = vi.fn();
  const onPaginationChange = vi.fn();

  render(
    <DataTable
      caption="Devices"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      sorting={sorting}
      onSortingChange={onSortingChange}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      globalFilter={props.globalFilter ?? ""}
    />,
  );

  return { user, onSortingChange };
}

describe("DataTable", () => {
  it("renders a caption and a header row", () => {
    renderTable();

    expect(screen.getByRole("table", { name: "Devices" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });

  it("asks the owner to sort when a sortable header is used", async () => {
    const { user, onSortingChange } = renderTable();

    await user.click(screen.getByRole("button", { name: /Name/ }));

    expect(onSortingChange).toHaveBeenCalled();
  });

  it("filters rows with the global filter", () => {
    renderTable({ globalFilter: "Lisbon" });

    expect(screen.getByText("Lisbon - Focus Room 2")).toBeInTheDocument();
    expect(screen.queryByText("Berlin - Exec Suite 1")).not.toBeInTheDocument();
  });
});
