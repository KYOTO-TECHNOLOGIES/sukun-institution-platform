import React from "react";
import Button, { ButtonGroup } from "../../bootstrap/Button";
import useDarkMode from "../../../hooks/useDarkMode";

const ButtonFilterOnHeader = ({ FilterStatus, activeTab, handleFilterStatus, styles }: any) => {
  const { themeStatus } = useDarkMode();

  return (
    <div style={{  ...styles }}>
      {/* Wrappable Button Group */}
      <ButtonGroup className="d-flex  w-100" style={{  padding: "8px" }}>
        {FilterStatus.map((status: any) => (
        <Button
            key={status}
            size='sm'
            color={activeTab === status ? 'secondary': themeStatus}
            onClick={() => handleFilterStatus(status)}>
            {status}
        </Button>
        
        ))}
      </ButtonGroup>
    </div>
  );
};

export default ButtonFilterOnHeader;
