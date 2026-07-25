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

  test("applies the secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button", { name: "Secondary" })).toHaveClass(
      "bg-gray-100"
    );
  });
});
