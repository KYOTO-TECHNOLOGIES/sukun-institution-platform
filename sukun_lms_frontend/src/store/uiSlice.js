import { createSlice } from '@reduxjs/toolkit';

// store/slices/uiSlice.js

const initialState = {
  headerTitle: '',
  breadcrumbs: [], // will store array of { label: string, path: string }
  activeTab: null, // will store array of { label: string, path: string }
//   locationPageJson: {site:null,parking:null,level:null,bay:null}, // will store array of { label: string, path: string }
//   mapVisible: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setHeaderTitle: (state, action) => {
      state.headerTitle = action.payload;
    },
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },
    updateBreadCrumbs:(state, action) => {
      state.breadcrumbs = [...state.breadcrumbs,action.payload]
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    // setLocationPageJson: (state, action) => {
    //   state.locationPageJson = {...state.locationPageJson, [action.payload.key]: action.payload.value};
    // },
    // setMapVisible: (state, action) => {
    //   state.mapVisible = action.payload;
    // },
  },
});

export const { setHeaderTitle, setBreadcrumbs , updateBreadCrumbs , setActiveTab} = uiSlice.actions;
export default uiSlice.reducer;
