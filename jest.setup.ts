// ─── Jest setup ─────────────────────────────────────────────────────────────
// Adds custom matchers like toBeInTheDocument(), toHaveTextContent(), etc.
// Runs once before each test file (via setupFilesAfterEnv in jest.config.ts).
//
// Without this import you'd be reduced to raw assertions like
// `expect(el !== null).toBe(true)`, which fail with an unhelpful
// "expected false to be true". jest-dom's matchers know about the DOM, so a
// failure reports what the element actually was.
import "@testing-library/jest-dom";
