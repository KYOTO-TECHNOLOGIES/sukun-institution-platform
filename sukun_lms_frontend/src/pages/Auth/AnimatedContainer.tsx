import React, { useLayoutEffect, useRef, useState } from 'react';

function AnimatedHeightWrapper({ children }) {
  const wrapperRef = useRef(null);
  const innerRef = useRef(null);
  const [height, setHeight] = useState('auto');

  useLayoutEffect(() => {
    const wrapper:any = wrapperRef.current;
    const inner:any = innerRef.current;

    if (!wrapper || !inner) return;

    // Step 1: Set height to current for transition
    wrapper.style.height = `${wrapper.offsetHeight}px`;

    // Force reflow to ensure the browser registers the height change
    void wrapper.offsetHeight;

    // Step 2: Measure and set new height
    const newHeight = inner.offsetHeight;
    wrapper.style.height = `${newHeight}px`;

    // Step 3: Reset to auto after transition ends
    const timeout = setTimeout(() => {
      wrapper.style.height = 'auto';
    }, 300); // match your CSS transition time

    return () => clearTimeout(timeout);
  }, [children]);

  return (
    <div
      ref={wrapperRef}
      style={{
        height,
        transition: 'height 0.3s ease',
        overflow: 'hidden',
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

export default AnimatedHeightWrapper;
