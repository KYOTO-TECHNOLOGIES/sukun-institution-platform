import { useState, useRef, useEffect, useContext } from 'react';
import { io } from "socket.io-client";
import { useDispatch } from 'react-redux';
import AuthContext from '../contexts/authContext';
import { wsUrl } from '../helpers/baseURL';

const WebsocketProvider = ({ children }) => {
	const { user } = useContext(AuthContext);
	const dispatch = useDispatch();
	const clientRef = useRef(null);
	const [isOpen, setIsOpen] = useState(false);


	useEffect(() => {
	setTimeout(() => {
		if (clientRef.current && clientRef.current.connected) {
			clientRef.current.emit('message', {
				data: {
					timestamp: Date.now(),
				},
		});
		} else {
			console.warn('Socket is not connected, cannot send ping');
		}}, 3000);
	}
	, [clientRef.current]);



	useEffect(() => {
		if (user) {
			// const token = Cookies.get("socketIOToken");
			const event = 'message'
			// const room = ''
			const url = `${wsUrl}`;
			const socket = io(url, {
				withCredentials: true,
				transports: ['websocket'],
			});
			clientRef.current = socket

			const handleSocketMessages = (message) => {
				try {
					const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
					console.log('Received message:', parsedMessage);
					switch (parsedMessage?.type) {

						case "recieved":
							// Handle received message
							console.log('Message received:', 'hello');
							break;
					
						default:
							console.warn('Unhandled message type:', parsedMessage.type);
					}

				} catch (err) {
					console.error('Error handling socket message:', err);
				}
			};

			// Handle connection events
			socket.on('connect', () => {
				setIsOpen(true);
			});

			socket.on('disconnect', () => {
				setIsOpen(false);
			});

			// socket.on('broadcast', (message) => {
			// 	handleSocketMessages(message);
			// });

			socket.on(event, (message) => {
				handleSocketMessages(message);
			});

			// Clean up on unmount
			return () => {
				//   setWebsocketState('cleanup');
				socket.disconnect();
			};
		}
		console.log(isOpen)
		  // Explicitly return undefined when `user` is falsy
		  return undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);


	return children;
};

export default WebsocketProvider;