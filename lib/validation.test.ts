import {
  checkoutSchema,
  signupSchema,
  productQuerySchema,
} from "./validation";

describe("checkoutSchema", () => {
  test("accepts a valid cart", () => {
    const r = checkoutSchema.safeParse({
      items: [{ productId: 1, quantity: 2 }],
    });
    expect(r.success).toBe(true);
  });

  test("rejects an empty cart", () => {
    expect(checkoutSchema.safeParse({ items: [] }).success).toBe(false);
  });

  test("rejects non-positive quantity", () => {
    const r = checkoutSchema.safeParse({
      items: [{ productId: 1, quantity: 0 }],
    });
    expect(r.success).toBe(false);
  });
});

describe("signupSchema", () => {
  test("accepts valid signup", () => {
    const r = signupSchema.safeParse({
      email: "a@b.com",
      password: "password123",
    });
    expect(r.success).toBe(true);
  });

  test("rejects a short password", () => {
    const r = signupSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(r.success).toBe(false);
  });

  test("rejects an invalid email", () => {
    const r = signupSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(r.success).toBe(false);
  });
});

describe("productQuerySchema", () => {
  test("coerces strings to numbers and applies defaults", () => {
    const r = productQuerySchema.parse({ page: "2", limit: "10" });
    expect(r.page).toBe(2);
    expect(r.limit).toBe(10);
    expect(r.sort).toBe("newest"); // default
  });

  test("rejects a limit over the max (50)", () => {
    expect(productQuerySchema.safeParse({ limit: "999" }).success).toBe(false);
  });
});
