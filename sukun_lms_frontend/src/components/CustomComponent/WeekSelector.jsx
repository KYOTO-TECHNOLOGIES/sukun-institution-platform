import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { buttonColor, daysOfWeek, daysOfWeekText } from "../../helpers/constants";


const WeekSelector = ({setSelectedWeekDays,selectedWeekDays,isDisable}) => {
  const [selectedDays, setSelectedDays] = useState(new Array(7).fill(true));

  const [title,setTitle]=useState('Every day')

   // Set initial state based on selectedWeekdays when the component mounts or selectedWeekdays changes
   useEffect(() => {
    setSelectedDays(daysOfWeekText.map(day => selectedWeekDays.includes(day)));
   	// eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [selectedWeekDays]);


  const toggleDay = (index) => {
    // Prevent deselecting the last selected day
    if (selectedDays.filter(Boolean).length === 1 && selectedDays[index]) {
      return;
    }
  
    const newSelectedDays = [...selectedDays];
    newSelectedDays[index] = !newSelectedDays[index];
    setSelectedDays(newSelectedDays);
  
    const updatedWeekdays = daysOfWeekText.filter((_, i) => newSelectedDays[i]);
    setSelectedWeekDays(updatedWeekdays);
  
    // Check if selected days are in order and continuous
    const firstIndex = daysOfWeekText.indexOf(updatedWeekdays[0]);
    const isContinuous = updatedWeekdays.every((day, i) => daysOfWeekText[firstIndex + i] === day);
    /* eslint-disable prefer-destructuring */
    let label = "";
    switch (updatedWeekdays.length) {
      case 7:
        label = "Every day";
        break;
      case 1:
        label = updatedWeekdays[0];
        break;
      default:
        label = isContinuous
          ? `${updatedWeekdays[0]} to ${updatedWeekdays[updatedWeekdays.length - 1]}`
          : updatedWeekdays.join(", ");
    }
    setTitle(label);
    /* eslint-enable prefer-destructuring */
  };
  

  return (
    // @ts-ignore
    <div className="mb-3" style={{pointerEvents:isDisable&&"none"}}>
      <span className="mb-3" style={{color:'#6C757D',fontWeight:500}}>{title}</span>
      <div className="d-flex gap-2 mt-2">
        {daysOfWeek.map((day, index) => (
          <div
            key={day}
            onClick={() => toggleDay(index)}
            role="button" 
            tabIndex={0} 
            onKeyPress={(e) => { if (e.key === "Enter") toggleDay(index); }}
            style={{
                backgroundColor:selectedDays[index] ?buttonColor[2]:"#E6E6E7",
                width:"30px",height:"30px",borderRadius:"50%",cursor:"pointer",
                textAlign:"center",alignContent:"center",
                color:selectedDays[index] ?"#E6E6E7":"#6C757D",
                userSelect:'none'}}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

    /* eslint-disable react/forbid-prop-types */
    WeekSelector.propTypes = {
        selectedWeekDays: PropTypes.any.isRequired,
        setSelectedWeekDays: PropTypes.func.isRequired,
        isDisable: PropTypes.bool,
};
  /* eslint-enable react/forbid-prop-types */
  WeekSelector.defaultProps = {
	isDisable: false, // or a more suitable default value
};
export default WeekSelector;
