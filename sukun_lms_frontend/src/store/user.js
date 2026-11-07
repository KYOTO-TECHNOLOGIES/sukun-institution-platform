// _____for usermanagment_____
import { createSlice } from "@reduxjs/toolkit";
import { userDummyData } from "../helpers/constants";

const initialState = {
  users: userDummyData,
  user_details: null,
};

const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUsersList(state, action) {
      state.users = action.payload;
    },
    addNewUser(state, action) {
      state.users = [...state.users, action.payload];
    },
    editUser(state, action) {
      state.users = state.users.map((data) =>
        data.id === action.payload.id ? action.payload : data
      );
    },
    deleteUser(state, action) {
      state.users = state.users.filter((data) => data.id !== action.payload);
    },
     setUserDetails(state, action) {
      state.user_details = action.payload;;
    },
   
  },
});

export const {
  addUsersList,
  addNewUser,
  editUser,
  deleteUser,
  setUserDetails,
 
} = UserSlice.actions;
export default UserSlice.reducer;
