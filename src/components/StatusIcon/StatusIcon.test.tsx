import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { STATUS_SEGMENTS } from "../../features/devices/statusMeta";
import { StatusIcon } from "./StatusIcon";

describe("StatusIcon", () => {
  it("renders a distinct SVG icon colored with the shared status token for each status", () => {
    for (const segment of STATUS_SEGMENTS) {
      const { container, unmount } = render(<StatusIcon status={segment.key} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("data-status", segment.key);
      expect(svg).toHaveStyle({ color: segment.color });
      unmount();
    }
  });
});
