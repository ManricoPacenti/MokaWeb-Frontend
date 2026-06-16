import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import type { AppDispatch, RootState } from './store';

/**
 * Typed Redux dispathc hook:
 * it allows components to dispatch normal actions and async thunks safely
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed Redux selector hook:
 * it allows components to read the global Redux state with TypeScript support
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;