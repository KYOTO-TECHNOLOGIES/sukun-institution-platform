import React from 'react'
import Select from 'react-select'
import useDarkMode from '../../../hooks/useDarkMode'

const ReactSelectWithState = ({ options, value, setValue, isClearable = false, placeholder, isMulti = false }: any) => {
    const { darkModeStatus } = useDarkMode();

    const customStyles = {
        menu: (base) => ({
            ...base,
            maxHeight: "150px",
            zIndex: 9999,
        }),
        control: (provided, state) => {
            let borderColor = "#F8F9FA"; // default
            let hoverBorderColor = "#F8F9FA";
            let boxShadow = "";

            if (state.isFocused) {
                borderColor = "#DFDFDF"; // blue when focused
                hoverBorderColor = "#DFDFDF";
                boxShadow = darkModeStatus ? "0 0 0 3px #35373C" : "0 0 0 3px #DFDFDF";
            }

            return {
                ...provided,
                height: '40px',
                border: darkModeStatus ? "1px solid #34393F" : boxShadow === '' ? '1px solid #ededed' : '',
                // borderRadius: '15px',
                backgroundColor: darkModeStatus ? "#212529" : "#F8F9FA",
                borderColor,
                boxShadow,
                fontWeight: 600,
                fontSize: "13px",
                zIndex: 'auto',
                ":hover": {
                    borderColor: darkModeStatus ? "#34393F" : hoverBorderColor,
                },
            };
        },
        menuList: (base) => ({
            ...base,
            maxHeight: "150px",
            backgroundColor: darkModeStatus ? "#212529" : "white",
            zIndex: 9999
        }),
        menuPortal: (base) => ({
            ...base,
            backgroundColor: darkModeStatus ? "#212529" : "white",
            zIndex: 9999,
        }),
        singleValue: (provided) => ({
            ...provided,
            color: darkModeStatus ? 'white' : 'black',
        }),
        option: (provided, state) => ({
            ...provided,
            zIndex: 9999,
            backgroundColor: state.isFocused ? (darkModeStatus ? "#35373C" : "#EFF2F7") : '',
            color: state.isFocused ? (darkModeStatus ? "white" : "black") : (darkModeStatus ? "white" : "inherit"),
            ":active": {
                backgroundColor: darkModeStatus ? "#35373C" : "#EFF2F7",
            },
        }),
    };

    return (
        <Select
            placeholder={placeholder}
            isMulti={isMulti}
            onChange={(values) => {
                setValue(values)
            }}
            className='react-select'
            isClearable={isClearable}
            styles={customStyles}
            options={options}
            value={value}
        />
    )
}

export default ReactSelectWithState
