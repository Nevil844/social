import React, { useState, useRef, useEffect } from 'react';

const MobileControls = ({ onMove, isEnabled = true }) => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [helpExpanded, setHelpExpanded] = useState(false);
  const joystickRef = useRef(null);
  const containerRef = useRef(null);

  // Detect if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth <= 768;

  if (!isMobile || !isEnabled) {
    return null;
  }

  const handleJoystickStart = (e) => {
    e.preventDefault();
    setJoystickActive(true);
    
    const touch = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    setTouchStartPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const handleJoystickMove = (e) => {
    if (!joystickActive) return;
    e.preventDefault();

    const touch = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = touch.clientX - rect.left - centerX;
    const deltaY = touch.clientY - rect.top - centerY;
    
    // Limit joystick movement to circle
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 40;
    
    let normalizedX = deltaX;
    let normalizedY = deltaY;
    
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * maxDistance;
      normalizedY = (deltaY / distance) * maxDistance;
    }
    
    setJoystickPosition({ x: normalizedX, y: normalizedY });
    
    // Send movement commands
    const moveSpeed = 3;
    const moveX = (normalizedX / maxDistance) * moveSpeed;
    const moveY = (normalizedY / maxDistance) * moveSpeed;
    
    if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
      onMove(moveX, moveY, 'joystick');
    }
  };

  const handleJoystickEnd = (e) => {
    e.preventDefault();
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    // Stop movement when joystick is released
    onMove(0, 0, 'joystick');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-30">
      {/* Help Button - Collapsible on Left */}
      <div className="absolute bottom-6 left-4 pointer-events-auto">
        <div className="flex items-end space-x-3">
          {/* Expanded Help Panel */}
          {helpExpanded && (
            <div className="bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-lg border border-white border-opacity-30 mb-2 transform transition-all duration-200 scale-100 opacity-100">
              <div className="font-medium mb-1 text-purple-300">Mobile Controls:</div>
              <div>🕹️ Use joystick (right)</div>
              <div>👆 Tap to move</div>
              <div className="text-xs opacity-70 mt-1">Double tap to stop</div>
            </div>
          )}
          
          {/* Help Toggle Button */}
          <button
            onClick={() => setHelpExpanded(!helpExpanded)}
            className="w-10 h-10 bg-black bg-opacity-50 rounded-full border border-white border-opacity-30 flex items-center justify-center text-white hover:bg-opacity-70 transition-all duration-200"
          >
            <span className="text-lg">
              {helpExpanded ? '×' : '?'}
            </span>
          </button>
        </div>
      </div>

      {/* Virtual Joystick - Right Side */}
      <div className="absolute bottom-6 right-4 pointer-events-auto">
        <div className="flex flex-col items-center">
          <div
            ref={containerRef}
            className="relative w-20 h-20 bg-black bg-opacity-40 rounded-full border-2 border-white border-opacity-50 shadow-lg"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            onMouseLeave={handleJoystickEnd}
          >
            {/* Joystick Knob */}
            <div
              className="absolute w-8 h-8 bg-white bg-opacity-90 rounded-full transition-all duration-100 shadow-md"
              style={{
                left: `calc(50% - 16px + ${joystickPosition.x}px)`,
                top: `calc(50% - 16px + ${joystickPosition.y}px)`,
                transform: joystickActive ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          {/* Joystick Label */}
          <div className="text-xs text-white text-center mt-2 opacity-70 font-medium">
            Move
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileControls; 