// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StatusChip, GpsQualityChip } from "./StatusChip";

describe("StatusChip & GpsQualityChip (Compact Mode)", () => {
  afterEach(() => {
    cleanup();
  });

  it("merender StatusChip mode compact dengan padding dan font ringkas", () => {
    render(<StatusChip label="Manual Mode" compact tone="amber" />);
    const chip = screen.getByText("Manual Mode").closest("div");
    expect(chip).toBeTruthy();
    expect(chip?.className).toContain("text-[11px]");
    expect(chip?.className).toContain("px-2 py-0.5");
  });

  it("merender GpsQualityChip compact dengan angka akurasi tabular ±4m", () => {
    render(<GpsQualityChip quality="excellent" accuracy={4.2} compact />);
    const accuracyLabel = screen.getByText("±4m");
    expect(accuracyLabel).toBeTruthy();
    const chip = accuracyLabel.closest("div");
    expect(chip?.className).toContain("font-mono");
    expect(chip?.className).toContain("tabular-nums");
  });

  it("merender GpsQualityChip compact fallback label saat akurasi undefined", () => {
    render(<GpsQualityChip quality="good" compact />);
    expect(screen.getByText("GPS Baik")).toBeTruthy();
  });

  it("merender GpsQualityChip compact untuk mode pencarian dan mode manual", () => {
    const { rerender } = render(<GpsQualityChip compact />);
    expect(screen.getByText("Mencari...")).toBeTruthy();

    rerender(<GpsQualityChip isManual compact />);
    expect(screen.getByText("Manual")).toBeTruthy();
  });

  it("mendukung interaksi keyboard dan klik untuk aksesibilitas", () => {
    const handleClick = vi.fn();
    render(<GpsQualityChip quality="good" accuracy={8} compact onClick={handleClick} />);
    const chip = screen.getByText("±8m").closest("div")!;
    expect(chip).toBeTruthy();
    expect(chip.getAttribute("role")).toBe("button");
    expect(chip.getAttribute("tabindex")).toBe("0");

    fireEvent.click(chip);
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(chip, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
