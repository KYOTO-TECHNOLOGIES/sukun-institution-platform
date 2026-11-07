import React from 'react';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import PlaceIcon from '@mui/icons-material/Place';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import RuleIcon from '@mui/icons-material/Rule';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import FlakyIcon from '@mui/icons-material/Flaky';
import LooksOneIcon from '@mui/icons-material/LooksOne';

const iconMap = {
	Text: <TextFieldsIcon />,
	'Large Text': <TextFieldsIcon />,
	Time: <AccessTimeIcon />,
	Date: <CalendarMonthIcon />,
	Number: <LooksOneIcon />,
	URL: <LinkIcon />,
	'Single Option': <RuleIcon />,
	'Multiple Options': <PlaylistAddCheckIcon />,
	Email: <MailOutlineIcon />,
	Address: <PlaceIcon />,
	Phone: <PhoneIphoneIcon />,
	Photo: <InsertPhotoIcon />,
	Document: <DescriptionIcon />,
	'Yes or no question': <FlakyIcon />,
};

export default iconMap
