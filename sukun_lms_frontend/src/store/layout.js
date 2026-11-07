import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  layoutType: "horizontal",
  layoutWidth: "fluid",
  leftSideBarTheme: "dark",
  leftSideBarType: "default",
  topbarTheme: "dark",
  isPreloader: false,
  showRightSidebar: false,
  isMobile: false,
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    changeLayout(state, action) {
      state.layoutType = action.payload;
    },
    changePreloader(state, action) {
      state.isPreloader = action.payload;
    },
    changeLayoutWidth(state, action) {
      state.layoutType = action.payload;
    },
    changeSidebarTheme(state, action) {
      state.layoutType = action.payload;
    },
    changeSidebarType(state, action) {
      state.leftSideBarType = action.payload;
    },
    changeTopbarTheme(state, action) {
      state.layoutType = action.payload;
    },
    toggleRightSidebar(state, action) {
      state.layoutType = action.payload;
    },
    showRightSidebar(state, action) {
      state.layoutType = action.payload;
    },
    hideRightSidebar(state, action) {
      state.layoutType = action.payload;
    },
  },
});

export const {
  changeLayout,
  changePreloader,
  changeLayoutWidth,
  changeSidebarTheme,
  changeSidebarType,
  changeTopbarTheme,
  toggleRightSidebar,
  showRightSidebar,
  hideRightSidebar,
} = layoutSlice.actions;
export default layoutSlice.reducer;
