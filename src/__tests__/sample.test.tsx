import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Sample Test", () => {
	it("should pass", () => {
		expect(1 + 1).toBe(2);
	});

	it("should render a component", () => {
		render(<div data-testid="test">Hello</div>);
		expect(screen.getByTestId("test")).toBeDefined();
		expect(screen.getByText("Hello")).toBeDefined();
	});
});
