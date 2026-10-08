import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, className = "" }) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const targetRef = useRef(null);

    const handleMouseEnter = () => {
        if (!targetRef.current) return;

        const rect = targetRef.current.getBoundingClientRect();

        // Set position to center-top of the target element
        setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 8 // 8px gap above element
        });

        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <>
            <div
                ref={targetRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={className}
            >
                {children}
            </div>
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.12, ease: "easeOut" }}
                            style={{
                                left: `${position.x}px`,
                                top: `${position.y}px`,
                                position: 'fixed',
                                transform: 'translate(-50%, -100%)',
                                zIndex: 9999,
                                pointerEvents: 'none'
                            }}
                        >
                            <div className="bg-neutral-900 text-white text-xs px-3 py-2.5 rounded-lg shadow-2xl max-w-xs leading-relaxed relative mb-2">
                                {content}
                                {/* Arrow pointing down, centered */}
                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2.5 h-2.5 bg-neutral-900 rotate-45"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
