import React, { useRef, useState, useEffect } from "react";
import Button, { ButtonGroup } from "../../bootstrap/Button";
import useDarkMode from "../../../hooks/useDarkMode";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const ButtonFilterOnHeader = ({ FilterStatus, activeTab, handleFilterStatus, styles }: any) => {
  const { themeStatus } = useDarkMode();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position and update arrow visibility
  const checkScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth);
    }
  };

  // Scroll by fixed offset
  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (el) {
      const scrollAmount = 150;
      el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...styles }}>
      {/* Left Arrow */}
      {showLeftArrow && (
        <IconButton size="small" onClick={() => scroll("left")} style={{ zIndex: 1 }}>
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
      )}

      {/* Scrollable Button Group */}
      <div
        ref={scrollRef}
        style={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          flex: 1,
        }}
      >
        <div style={{ display: "inline-flex", padding: 8 }}>
          {FilterStatus.map((status: any) => (
            <Button
              key={status}
              size="sm"
              color={activeTab === status ? "primary" : themeStatus}
              onClick={() => handleFilterStatus(status)}
              style={{ marginRight: "3px", whiteSpace: "nowrap" }}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <IconButton size="small" onClick={() => scroll("right")} style={{ zIndex: 1 }}>
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      )}
    </div>
  );
};

export default ButtonFilterOnHeader;
