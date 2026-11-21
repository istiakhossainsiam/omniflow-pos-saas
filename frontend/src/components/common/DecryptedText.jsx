import React, { useState, useEffect, useRef } from 'react';

/**
 * DecryptedText Component (inspired by react-bits)
 * Scrambles and decrypts text on mount or hover for high-tech SaaS polish.
 */
export default function DecryptedText({
  text = '',
  speed = 40,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()',
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-emerald-500/80',
  animateOn = 'mount', // 'mount' | 'hover' | 'view'
}) {
  const strText = String(text ?? '');
  const [displayText, setDisplayText] = useState(strText);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef(null);

  const getNextChar = (targetChar) => {
    if (useOriginalCharsOnly) {
      const validChars = strText.replace(/\s/g, '');
      return validChars[Math.floor(Math.random() * validChars.length)] || targetChar;
    }
    return characters[Math.floor(Math.random() * characters.length)];
  };

  const scramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScrambling(true);

    const originalLength = strText.length;
    if (originalLength === 0) {
      setDisplayText('');
      setIsScrambling(false);
      return;
    }

    let iteration = 0;

    intervalRef.current = setInterval(() => {
      let result = '';

      for (let i = 0; i < originalLength; i++) {
        const char = strText[i];
        if (char === ' ') {
          result += ' ';
          continue;
        }

        const shouldReveal = sequential
          ? (revealDirection === 'start' ? i < Math.floor(iteration / 2) : i >= originalLength - Math.floor(iteration / 2))
          : Math.random() < iteration / maxIterations;

        if (iteration >= maxIterations || shouldReveal) {
          result += char;
        } else {
          result += getNextChar(char);
        }
      }

      setDisplayText(result);
      iteration++;

      if (iteration > maxIterations + (sequential ? originalLength * 2 : 2)) {
        clearInterval(intervalRef.current);
        setDisplayText(strText);
        setIsScrambling(false);
      }
    }, speed);
  };

  useEffect(() => {
    setDisplayText(strText);
    if (animateOn === 'mount') {
      scramble();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover' && !isScrambling) {
      setIsHovering(true);
      scramble();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <span
      className={`inline-block font-mono tracking-tight cursor-default ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={`${isScrambling ? encryptedClassName : ''} ${className}`}>
        {displayText}
      </span>
    </span>
  );
}
