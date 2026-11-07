import React from 'react'
import Select from 'react-select'
import { Controller } from 'react-hook-form';
import FormGroup from '../../bootstrap/forms/FormGroup';
import useSelectStyles from '../../../hooks/useSelectStyle';
import useDarkMode from '../../../hooks/useDarkMode';

const ReactSelectWithOnchangeComponent = ({control,name,isMulti,field_name,getValues,errors,options, isRequired,onChangeFunction,isDisable}:any) => {
	// const reactSelectStyle = useSelectStyles(isMulti);
    const{darkModeStatus}=useDarkMode();

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

        if (errors[field_name]?.type) {
            borderColor = "#F46132"; // red for error
            hoverBorderColor = "#F46132";
            boxShadow = state.isFocused ? "0 0 0 1px #F46132" : "none";
        } 
        // else if (hasValue) {
        //     borderColor = "#46BCAA"; // green when has value
        //     hoverBorderColor = "#46BCAA";
        //     boxShadow = state.isFocused ? "0 0 0 1px #46BCAA" : "none";
        // }
         else if (state.isFocused) {
            borderColor = "#DFDFDF"; // blue when focused
            hoverBorderColor = "#DFDFDF";
            boxShadow =darkModeStatus?"0 0 0 3px #35373C": "0 0 0 3px #DFDFDF";
        }

        return {
            ...provided,
            height: '40px',
            border:(darkModeStatus&&!errors[field_name]?.type)?"1px solid #34393F":boxShadow===''?'1px solid #ededed':'',
            // borderRadius: '15px',
            backgroundColor:darkModeStatus?"#212529": "#F8F9FA",
            borderColor,
            boxShadow,
            fontWeight: 600,
            fontSize: "13px",
            zIndex: 'auto',
            
            ":hover": {
                borderColor:darkModeStatus?"#34393F": hoverBorderColor,
            },
        };
    },
    menuList: (base) => ({
        ...base,
        maxHeight: "150px",
        backgroundColor: darkModeStatus?"#212529":"white",
        zIndex: 9999
    }),
    menuPortal: (base) => ({
        ...base,
        backgroundColor: "white",
        zIndex: 9999,
    }),
    singleValue: (provided:any) => ({
        ...provided,
        color:darkModeStatus? 'white':'black', // Ensure selected value text is red
    }),
    option: (provided, state) => ({
        ...provided,
        zIndex: 9999,
        backgroundColor: state.isFocused ? "#EFF2F7" : '',
        color: state.isFocused ? "black" : "inherit",
        ":active": {
            backgroundColor: "#EFF2F7",
        },
    }),
};

  return (
    <FormGroup label={name}>
    <Controller
        name={field_name}
        control={control}
        rules={{
            required: isRequired,
        }}
        render={({ field }) => (
            <Select
                placeholder=''
                onChange={(values) => {
                    field.onChange(values);
                    onChangeFunction(values)
                }}
                isClearable={false}
                styles={customStyles}
                // styles={reactSelectStyle}
                options={options}
                value={getValues(field_name)}
                isDisabled={isDisable}
            />
        )}
    />
    {errors[field_name]?.type ? (
        <span style={{ color: 'red' }}>*This field is required</span>
    ) : (
        <p />
    )}
</FormGroup>
  )
}

export default ReactSelectWithOnchangeComponent
