import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    notification : null
}

{/* eslint-disable no-nested-ternary */}

const DashboardSlice = createSlice({
    name: 'Dashboard',
    initialState,
    reducers: {
        addNotifications(state, action) {
            state.notification = action.payload;
        },
        addNewNotification(state, action) {
            state.notification = [...state.notification, action.payload];
        },
        updateNotification(state, action) {
            state.notification = state.notification.map(notification => notification.id === action.payload.id ? action.payload : notification);
        },
        deleteNotification(state, action) {
            state.notification = state.notification.filter(notification => notification.id !== action.payload.id);
        }

    }})

export const {    
    addNotifications,
    addNewNotification,
    updateNotification,
    deleteNotification
} = DashboardSlice.actions;
export default DashboardSlice.reducer;
{/* eslint-enable no-nested-ternary */ }
