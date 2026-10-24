import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("is decorative — the loading region carries aria-busy", () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
