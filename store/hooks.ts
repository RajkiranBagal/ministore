import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// Pre-typed versions of the react-redux hooks. Use these everywhere instead
// of the raw useDispatch/useSelector so you get full type safety + autocomplete
// without annotating types at every call site.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
