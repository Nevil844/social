import React from 'react';

const Avatar = ({ avatar, size = 40, showName = false, name = '' }) => {
  const { skinTone, hairColor, shirtColor, gender, hairStyle } = avatar;
  
  const generateSVG = () => {
    const svgSize = size;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const radius = svgSize * 0.35;

    return (
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Shadow */}
        <ellipse
          cx={centerX + 1}
          cy={centerY + radius + 2}
          rx={radius * 0.8}
          ry={radius * 0.2}
          fill="rgba(0,0,0,0.2)"
        />
        
        {/* Shirt/Body */}
        <ellipse
          cx={centerX}
          cy={centerY + radius * 0.6}
          rx={radius * 1.2}
          ry={radius * 0.8}
          fill={shirtColor}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />
        
        {/* Face */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill={skinTone}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />
        
        {/* Face highlight */}
        <ellipse
          cx={centerX - radius * 0.3}
          cy={centerY - radius * 0.3}
          rx={radius * 0.3}
          ry={radius * 0.4}
          fill="rgba(255,255,255,0.3)"
        />
        
        {/* Hair */}
        {renderHair(centerX, centerY, radius, hairColor, hairStyle, gender)}
        
        {/* Eyes */}
        <circle cx={centerX - radius * 0.25} cy={centerY - radius * 0.1} r={radius * 0.08} fill="white" />
        <circle cx={centerX + radius * 0.25} cy={centerY - radius * 0.1} r={radius * 0.08} fill="white" />
        <circle cx={centerX - radius * 0.25} cy={centerY - radius * 0.1} r={radius * 0.05} fill="#2D3748" />
        <circle cx={centerX + radius * 0.25} cy={centerY - radius * 0.1} r={radius * 0.05} fill="#2D3748" />
        <circle cx={centerX - radius * 0.22} cy={centerY - radius * 0.12} r={radius * 0.02} fill="white" />
        <circle cx={centerX + radius * 0.28} cy={centerY - radius * 0.12} r={radius * 0.02} fill="white" />
        
        {/* Eyebrows */}
        <ellipse cx={centerX - radius * 0.25} cy={centerY - radius * 0.25} rx={radius * 0.12} ry={radius * 0.04} fill={hairColor} />
        <ellipse cx={centerX + radius * 0.25} cy={centerY - radius * 0.25} rx={radius * 0.12} ry={radius * 0.04} fill={hairColor} />
        
        {/* Nose */}
        <ellipse cx={centerX} cy={centerY + radius * 0.1} rx={radius * 0.06} ry={radius * 0.08} fill="rgba(0,0,0,0.1)" />
        
        {/* Mouth */}
        <ellipse cx={centerX} cy={centerY + radius * 0.3} rx={radius * 0.15} ry={radius * 0.06} fill="#D53F8C" />
        <ellipse cx={centerX} cy={centerY + radius * 0.28} rx={radius * 0.12} ry={radius * 0.04} fill="rgba(255,255,255,0.3)" />
        
        {/* Clothing details */}
        <rect
          x={centerX - radius * 0.1}
          y={centerY + radius * 0.6}
          width={radius * 0.2}
          height={radius * 0.4}
          fill="rgba(255,255,255,0.2)"
          rx={radius * 0.02}
        />
      </svg>
    );
  };

  const renderHair = (centerX, centerY, radius, hairColor, hairStyle, gender) => {
    const elements = [];
    
    switch (hairStyle) {
      case 'short':
        elements.push(
          <path
            key="hair"
            d={`M ${centerX - radius * 0.8} ${centerY - radius * 0.3}
                C ${centerX - radius * 0.9} ${centerY - radius * 0.8}
                  ${centerX + radius * 0.9} ${centerY - radius * 0.8}
                  ${centerX + radius * 0.8} ${centerY - radius * 0.3}
                C ${centerX + radius * 0.7} ${centerY - radius * 0.6}
                  ${centerX - radius * 0.7} ${centerY - radius * 0.6}
                  ${centerX - radius * 0.8} ${centerY - radius * 0.3} Z`}
            fill={hairColor}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />
        );
        break;
        
      case 'long':
        elements.push(
          <path
            key="hair"
            d={`M ${centerX - radius * 0.9} ${centerY - radius * 0.2}
                C ${centerX - radius * 1.1} ${centerY - radius * 0.9}
                  ${centerX + radius * 1.1} ${centerY - radius * 0.9}
                  ${centerX + radius * 0.9} ${centerY - radius * 0.2}
                C ${centerX + radius * 1.0} ${centerY + radius * 0.5}
                  ${centerX - radius * 1.0} ${centerY + radius * 0.5}
                  ${centerX - radius * 0.9} ${centerY - radius * 0.2} Z`}
            fill={hairColor}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />
        );
        break;
        
      case 'curly':
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x = centerX + Math.cos(angle - Math.PI / 2) * radius * 0.8;
          const y = centerY + Math.sin(angle - Math.PI / 2) * radius * 0.8;
          elements.push(
            <circle
              key={`curl-${i}`}
              cx={x}
              cy={y}
              r={radius * 0.15}
              fill={hairColor}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="0.5"
            />
          );
        }
        break;
        
      case 'braids':
        elements.push(
          <path
            key="hair-base"
            d={`M ${centerX - radius * 0.8} ${centerY - radius * 0.3}
                C ${centerX - radius * 0.9} ${centerY - radius * 0.8}
                  ${centerX + radius * 0.9} ${centerY - radius * 0.8}
                  ${centerX + radius * 0.8} ${centerY - radius * 0.3} Z`}
            fill={hairColor}
          />
        );
        // Left braid
        elements.push(
          <rect
            key="braid-left"
            x={centerX - radius * 1.1}
            y={centerY - radius * 0.1}
            width={radius * 0.15}
            height={radius * 1.2}
            fill={hairColor}
            rx={radius * 0.075}
          />
        );
        // Right braid
        elements.push(
          <rect
            key="braid-right"
            x={centerX + radius * 0.95}
            y={centerY - radius * 0.1}
            width={radius * 0.15}
            height={radius * 1.2}
            fill={hairColor}
            rx={radius * 0.075}
          />
        );
        break;
        
      case 'fade':
        elements.push(
          <path
            key="hair"
            d={`M ${centerX - radius * 0.7} ${centerY - radius * 0.2}
                C ${centerX - radius * 0.8} ${centerY - radius * 0.7}
                  ${centerX + radius * 0.8} ${centerY - radius * 0.7}
                  ${centerX + radius * 0.7} ${centerY - radius * 0.2}
                C ${centerX + radius * 0.6} ${centerY - radius * 0.5}
                  ${centerX - radius * 0.6} ${centerY - radius * 0.5}
                  ${centerX - radius * 0.7} ${centerY - radius * 0.2} Z`}
            fill={hairColor}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />
        );
        break;
        
      case 'bob':
        elements.push(
          <path
            key="hair"
            d={`M ${centerX - radius * 0.9} ${centerY - radius * 0.1}
                C ${centerX - radius * 1.0} ${centerY - radius * 0.8}
                  ${centerX + radius * 1.0} ${centerY - radius * 0.8}
                  ${centerX + radius * 0.9} ${centerY - radius * 0.1}
                C ${centerX + radius * 0.8} ${centerY + radius * 0.1}
                  ${centerX - radius * 0.8} ${centerY + radius * 0.1}
                  ${centerX - radius * 0.9} ${centerY - radius * 0.1} Z`}
            fill={hairColor}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />
        );
        break;
        
      default:
        elements.push(
          <circle
            key="hair"
            cx={centerX}
            cy={centerY - radius * 0.2}
            r={radius * 0.8}
            fill={hairColor}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />
        );
    }
    
    return elements;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {generateSVG()}
        {/* Online status indicator */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
      </div>
      {showName && name && (
        <span className="text-xs font-medium text-gray-700 mt-1 text-center max-w-16 truncate">
          {name}
        </span>
      )}
    </div>
  );
};

export default Avatar; 