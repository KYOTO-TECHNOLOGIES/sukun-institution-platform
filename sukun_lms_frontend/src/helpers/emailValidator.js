// A simple email validation function that checks if the email is in a valid format
const validateEmail = (email,required='') => {
    let error;
    if (required!=='') {
      error = 'Required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      error = 'Invalid email address';
    }
    return error;
  };
  export default validateEmail