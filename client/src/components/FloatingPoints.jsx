/**
 * @file FloatingPoints.jsx
 * @description Animated floating score popups that appear on correct answers and drift upward.
 * Uses Framer Motion for smooth enter/exit transitions.
 * @module client/components/FloatingPoints
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let pointIdCounter = 0;

export default function FloatingPoints({ trigger }) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (trigger && trigger.points > 0) {
      const id = ++pointIdCounter;
      const xOffset = Math.random() * 80 - 40;
      setPoints(prev => [...prev, { id, value: trigger.points, x: xOffset }]);

      // Auto-remove after animation completes
      setTimeout(() => {
        setPoints(prev => prev.filter(p => p.id !== id));
      }, 1200);
    }
  }, [trigger]);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      <AnimatePresence>
        {points.map(pt => (
          <motion.div
            key={pt.id}
            initial={{ opacity: 1, y: 0, x: pt.x, scale: 0.5 }}
            animate={{ opacity: 0, y: -120, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '1.5rem',
              color: 'var(--accent-yellow)',
              textShadow: '0 0 15px var(--accent-gold-glow), 0 2px 4px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            +{pt.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

