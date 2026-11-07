import { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
// import { ErrorAlert, SuccessAlert, Toastr } from './Alert';
import Error from '../helpers/Error';
import useToasterNotification from './useToasterNotification';
// import { ErrorAlert,SuccessAlert,Toastr } from '../helpers/Alert';
// import Error from './Error';

const useFetchUpdateDeleteHook = () => {
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleFetchUpdateDelete = (url, data, reduxFunction, method,message, id,tableRef) => {
    setLoading(true);

    // Validate the method parameter to ensure it's a valid HTTP method.
    const validMethods = ['get', 'post', 'put', 'delete','patch'];
    if (!validMethods.includes(method.toLowerCase())) {
        showErrorNotification( 'Invalid HTTP method specified.');
      setLoading(false);
      return;
    }

    // Use the appropriate axios method based on the input 'method' parameter.
    axios[method.toLowerCase()](url, data)
      .then((response) => {

        // The tableREF comes from the pages where the table is using custom pagination so we need to refresh the content 
        // for reflecting the data changes rather than editing the state inside the redux store,in pagination we are not managing the state or sotring it anywhere
        if(tableRef){
          tableRef.current.onQueryChange();
        }
        else{

          if(reduxFunction){
            if (method === 'delete' || id) {
              dispatch(reduxFunction(id));
            } else {
              dispatch(reduxFunction(response.data));
            }
          }
          // props.tableRef.current.onQueryChange();
         
        }
        if(method !== 'get'){
          showSuccessNotification(message);
        }
      })
      .catch((error) => {

        showErrorNotification(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return { loading, handleFetchUpdateDelete };
};

export default useFetchUpdateDeleteHook;