import { useContext } from "react";
import AuthContext from "../contexts/authContext";

const permissionObject = {
	reader_add: ['Superuser'],
	is_super_user:['Superuser'],
	trip_schedule_management:['Admin','Superuser'],
	trip_details_management:['Admin','Superuser'],
	route_management:['Admin','Superuser'],
	bus_management:['Admin','Superuser'],
	employee_delete:['Admin','Superuser'],
	driver_management:['Admin','Superuser'],
	inspector_management:['Admin','Superuser'],
	user_management:['Admin','Superuser'],
	reader_management:['Admin','Superuser'],
};

const usePermissionHook = (page) => {
	const {userData}=useContext(AuthContext)
	return permissionObject[page].includes(userData?.user_type);
};

export default usePermissionHook;
