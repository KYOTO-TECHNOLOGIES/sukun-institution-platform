import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const initialState = {
  loggedIn: null,
  profile: null,
  tenantDetails: null,
  routing_permissions: {
    "account-settings": [],
    "evacuation-report": [],
    "history-reports": [],
    "manage-events": [],
    "manage-groups": [],
    "manage-sites": [],
    notifications: [],
    "portal-users": [],
    "pre-registration-forms": [],
    "timesheet-reports": [],
    "today-view": [],
  },
  page_permissions: {},
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLogin(state, action) {
      state.loggedIn = true;
      state.profile = action?.payload?.user;
    },
    setPagePermission(state, action) {
      state.page_permissions = action?.payload;
    },
    setRoutingPermission(state, action) {
      state.routing_permissions = action?.payload;
    },
    setLogOut(state) {
      state.loggedIn = false;
      state.profile = null;
      state.tenantDetails = null;
      Cookies.remove("token");
      Cookies.remove("tenant");
      Cookies.remove("selected_site");
    },
    setProfile(state, action) {
      state.profile = action.payload;
    },
    setTenant(state, action) {
      state.tenantDetails = action.payload;
    },
    updateTenantLogo(state, action) {
      state.tenantDetails = { ...state.tenantDetails, logo: action.payload };
    },
  },
});

export const {
  setLogin,
  setLogOut,
  setProfile,
  setTenant,
  updateTenantLogo,
  setRoutingPermission,
  setPagePermission,
} = authSlice.actions;
export default authSlice.reducer;
