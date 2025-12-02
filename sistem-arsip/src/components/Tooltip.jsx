import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, className = "" }) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            x: rect.left + rect.width / 2,
            y: rect.top
        });
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <>
            <div
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
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            style={{
                                left: coords.x,
                                top: coords.y,
                                position: 'fixed',
                                zIndex: 9999,
                                pointerEvents: 'none'
                            }}
                            className="-translate-x-1/2 -translate-y-full pb-2"
                        >
                            <div className="bg-neutral-800/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-[250px] text-center leading-relaxed relative border border-white/10">
                                {content}
                                {/* Arrow */}
                                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-neutral-800/90 border-r border-b border-white/10"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
