import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for animated number counting
 * @param {number} end - Target number to count to
 * @param {number} duration - Animation duration in milliseconds
 * @returns {number} - Current animated value
 */
export function useAnimatedCounter(end, duration = 1000) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        const startValue = countRef.current;
        const endValue = end;

        if (startValue === endValue) return;

        const animate = (timestamp) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out quad)
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);

            const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuad);

            setCount(currentValue);
            countRef.current = currentValue;

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        startTimeRef.current = null;
        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [end, duration]);

    return count;
}

export default useAnimatedCounter;
