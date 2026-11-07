import React from 'react'
import Select from 'react-select'
import FormGroup from '../../bootstrap/forms/FormGroup';

const ReactSelectFormik = ({ formik }) => {
    const hasError = formik.touched.first_name && formik.errors.first_name;
    const hasValue = !!formik.values.first_name;
    
    const customStyles = {
        menu: (base) => ({
            ...base,
            backgroundColor: "white",
            maxHeight: "150px",
            zIndex: 9999,
        }),
        control: (provided, state) => {
            let borderColor = "#F8F9FA"; // default
            let hoverBorderColor = "#F8F9FA";
            let boxShadow = "none";

            if (hasError) {
                borderColor = "#F46132"; // red for error
                hoverBorderColor = "#F46132";
                boxShadow = state.isFocused ? "0 0 0 1px #F46132" : "none";
            } else if (hasValue) {
                borderColor = "#46BCAA"; // green when has value
                hoverBorderColor = "#46BCAA";
                boxShadow = state.isFocused ? "0 0 0 1px #46BCAA" : "none";
            } else if (state.isFocused) {
                borderColor = "#B6AEE9"; // blue when focused
                hoverBorderColor = "#B6AEE9";
                boxShadow = "0 0 0 1px #B6AEE9";
            }

            return {
                ...provided,
                height: '40px',
                backgroundColor: "#F8F9FA",
                borderColor,
                boxShadow,
                fontWeight: 600,
                fontSize: "13px",
                zIndex: 'auto',
                ":hover": {
                    borderColor: hoverBorderColor,
                },
            };
        },
        menuList: (base) => ({
            ...base,
            maxHeight: "150px",
            backgroundColor: "white",
            zIndex: 9999
        }),
        menuPortal: (base) => ({
            ...base,
            backgroundColor: "white",
            zIndex: 9999,
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
        <FormGroup id="first_name" label="">
            <Select
                placeholder="Last Name"
                name="first_name"
                options={[
                    { value: 'smith', label: 'Smith' },
                    { value: 'johnson', label: 'Johnson' },
                    { value: 'doe', label: 'Doe' },
                ]}
                styles={customStyles}
                onChange={(selectedOption) => {
                    formik.setFieldValue('first_name', selectedOption?.value || '');
                }}
                onBlur={() => formik.setFieldTouched('first_name', true)}
                value={
                    formik.values.first_name
                        ? { value: formik.values.first_name, label: formik.values.first_name }
                        : null
                }
                classNamePrefix="react-select"
                className={
                    formik.touched.first_name && formik.errors.first_name
                        ? 'is-invalid'
                        : ''
                }
            />
            {formik.touched.first_name && formik.errors.first_name && (
                <div className="invalid-feedback d-block">
                    {formik.errors.first_name}
                </div>
            )}
        </FormGroup>
    )
}

export default ReactSelectFormik;