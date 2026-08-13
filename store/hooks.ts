// ─── Typed Redux hooks ──────────────────────────────────────────────────────
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// Pre-typed versions of the react-redux hooks. Use these everywhere instead
// of the raw useDispatch/useSelector so you get full type safety + autocomplete
// without annotating types at every call site.
//
// Without them, every selector needs a manual annotation:
//     useSelector((state: RootState) => state.cart.items)
// and forgetting it leaves `state` as `any` — no autocomplete, no error when
// you typo `state.crat`. With them:
//     useAppSelector((state) => state.cart.items)   // fully typed
//
// `.withTypes<...>()` is the Redux Toolkit 2.x API for this. Older codebases
// you'll encounter declare the same thing as explicitly typed constants —
// same idea, older syntax.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
