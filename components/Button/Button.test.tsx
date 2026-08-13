// ─── Button tests ───────────────────────────────────────────────────────────
// The reference example for component testing in this repo. Note the governing
// principle of React Testing Library: test what a USER experiences, not how the
// component is built. No assertions about internal state, no shallow rendering,
// no reaching for the component instance.
//
// The payoff is that these tests survive refactors. Rewrite Button's internals
// and they still pass; break its behaviour and they fail.
//
// `describe`, `test`, `expect` and `jest` are globals — no imports needed,
// because Jest injects them.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button", () => {
  test("renders its children as the accessible label", () => {
    render(<Button>Add to cart</Button>);
    // getByRole finds the <button> by its ROLE and accessible NAME —
    // the same way a screen reader (and a user) identifies it.
    expect(
      screen.getByRole("button", { name: "Add to cart" })
    ).toBeInTheDocument();
  });

  test("calls onClick when clicked", async () => {
    const handleClick = jest.fn(); // a mock function that records calls
    // userEvent simulates a REAL interaction — pointer events, focus, the lot —
    // whereas fireEvent.click() dispatches one synthetic event. userEvent
    // catches bugs fireEvent misses, which is why it's the default choice.
    // It's async, so every interaction needs `await`.
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button", { name: "Click me" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("does not call onClick when disabled", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Click me" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  // The weakest test of the four: asserting on a CSS class couples it to
  // Tailwind's exact utility names, so renaming a colour breaks it even though
  // nothing is actually wrong. Kept because variant styling is otherwise
  // untestable in jsdom (which computes no real styles) — the robust version of
  // this check is a Storybook visual regression test.
  test("applies the secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button", { name: "Secondary" })).toHaveClass(
      "bg-gray-100"
    );
  });
});
