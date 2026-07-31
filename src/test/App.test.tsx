import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

// Mock ECharts to avoid canvas rendering in jsdom
vi.mock("echarts", () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Mock fetch for API calls
(window as any).fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ result: "Hello, World!" }),
  blob: () => Promise.resolve(new Blob(["test"], { type: "text/csv" })),
});

describe("App", () => {
  it("renders three tabs", () => {
    render(<App />);
    expect(screen.getByText("HelloWorld")).toBeInTheDocument();
    expect(screen.getByText("哈希")).toBeInTheDocument();
    expect(screen.getByText("冒泡排序")).toBeInTheDocument();
  });

  it("switches to hash tab on click", () => {
    render(<App />);
    fireEvent.click(screen.getByText("哈希"));
    // Hash tab has algorithm select with SHA-256 default
    expect(screen.getByDisplayValue("SHA-256")).toBeInTheDocument();
  });

  it("shows report panel", () => {
    render(<App />);
    expect(screen.getByText("调用情况报表")).toBeInTheDocument();
  });
});
