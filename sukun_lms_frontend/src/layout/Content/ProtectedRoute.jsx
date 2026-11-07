import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import WebsocketProvider from '../../WebsocketWrapper/WebSocket';

const ProtectedRoute = ({ element }) => {
  // return <WebsocketProvider>{element}</WebsocketProvider>
  return element
};

/* eslint-disable react/forbid-prop-types */
ProtectedRoute.propTypes = {
  element: PropTypes.any.isRequired // element is expected to be a React element and is required
};
/* eslint-enable react/forbid-prop-types */

export default ProtectedRoute;
