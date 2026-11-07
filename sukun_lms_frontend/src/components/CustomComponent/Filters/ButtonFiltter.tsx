import React from "react";
import Button, { ButtonGroup } from "../../bootstrap/Button";
import useDarkMode from "../../../hooks/useDarkMode";

const ButtonFiltter = ({ FilterStatus, activeTab, setActiveTab, styles }: any) => {
  const { themeStatus } = useDarkMode();

  return (
    <div style={{ position: "absolute", zIndex: 2, ...styles }}>
      {/* Wrappable Button Group */}
      <ButtonGroup className="d-flex flex-wrap w-100" style={{  padding: "8px" }}>
        {FilterStatus.map((status: any) => (
        <Button
            key={status}
            size='sm'
            color={activeTab === status ? 'primary': themeStatus}
            onClick={() => setActiveTab(status)}>
            {status}
        </Button>
        
        ))}
      </ButtonGroup>
    </div>
  );
};

export default ButtonFiltter;
