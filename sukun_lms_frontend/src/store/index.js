import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import layoutSlice from './layout';
import authSlice from './auth';
import UiSlice from './uiSlice';

const rootReducer = combineReducers({
	layoutSlice,
	authSlice,
	UiSlice,
});

// Persist config
const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['UiSlice'], // only persist the ui slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false, // required for redux-persist
		}),
});

// Create persistor
export const persistor = persistStore(store);

export default store;
