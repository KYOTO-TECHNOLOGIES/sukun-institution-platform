import React from 'react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useDarkMode from '../../../hooks/useDarkMode';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import { TextField } from '@mui/material';

interface StyledDatePickerProps {
  darkMode?: boolean;
}

const StyledDatePicker = styled(DatePicker, {
  shouldForwardProp: (prop) => prop !== 'darkMode',
})<StyledDatePickerProps>(({ darkMode }) => ({
  '& .MuiInputBase-root': {
    height: '40px',
    // borderRadius: '15px',
    backgroundColor: darkMode ? '#212529' : '#F8F9FA',
    border: darkMode ? '1px solid #34393F' : '1px solid #ededed',
    '&:hover': {
      borderColor: darkMode ? '#34393F' : '#DFDFDF',
    },
    '&.Mui-focused': {
      borderColor: darkMode ? '#35373C' : '#DFDFDF',
      boxShadow: darkMode ? '0 0 0 3px #35373C' : '0 0 0 3px #DFDFDF',
    },
  },
  '& .MuiInputBase-input': {
    color: darkMode ? 'white' : 'grey',
    fontWeight: 600,
    fontSize: '13px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiSvgIcon-root': {
    color: darkMode ? 'white' : 'black',
  },
}));

function MuiDateFilter({views, handleDateChange, value}:any) {
  const { darkModeStatus } = useDarkMode();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StyledDatePicker
        views={views}
        darkMode={darkModeStatus}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => handleDateChange(newValue)}
        maxDate={dayjs()}
        slotProps={{
          textField: {
            fullWidth: true,
          },
          popper: {
            sx: {
              '& .MuiPaper-root': {
                backgroundColor: darkModeStatus ? '#212529' : 'white',
                color: darkModeStatus ? 'white' : 'black',
              },
              '& .MuiPickersDay-root': {
                color: darkModeStatus ? 'white' : 'black',
                '&.Mui-selected': {
                  backgroundColor: '#EFF2F7',
                  color: 'black',
                },
                '&:hover': {
                  backgroundColor: '#EFF2F7',
                },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  )
}

export default MuiDateFilter