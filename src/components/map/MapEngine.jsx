/**
 * MapEngine – core pan/zoom canvas-style map built on SVG + transform.
 * Handles smooth zoom, pan, touch gestures, and coordinate transforms.
 */
import { useState, useRef, useEffect, useCallback } from "react";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.25;

export function useMapEngine(containerRef) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const animFrame = useRef(null);

  // Zoom to a point (world coords)
  const zoomTo = useCallback((newZoom, centerX, centerY) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    setZoom(prev => {
      const ratio = clamped / prev;
      setPan(p => ({
        x: centerX - ratio * (centerX - p.x),
        y: centerY - ratio * (centerY - p.y),
      }));
      return clamped;
    });
  }, []);

  const smoothPanTo = useCallback((targetPx, targetPy, currentZoom) => {
    // Animate pan to center a world-percent point
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const destX = width / 2 - targetPx * currentZoom;
    const destY = height / 2 - targetPy * currentZoom;

    let frame = 0;
    const animate = () => {
      frame++;
      setPan(p => ({
        x: p.x + (destX - p.x) * 0.12,
        y: p.y + (destY - p.y) * 0.12,
      }));
      if (frame < 30) animFrame.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(animate);
  }, [containerRef]);

  // Mouse events
  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(prev => {
      const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      const ratio = newZ / prev;
      setPan(p => ({
        x: cx - ratio * (cx - p.x),
        y: cy - ratio * (cy - p.y),
      }));
      return newZ;
    });
  }, [containerRef]);

  // Touch events
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    } else if (e.touches.length === 2 && lastTouchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / lastTouchDist.current;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const cx = midX - rect.left;
        const cy = midY - rect.top;
        setZoom(prev => {
          const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * ratio));
          const r2 = newZ / prev;
          setPan(p => ({ x: cx - r2 * (cx - p.x), y: cy - r2 * (cy - p.y) }));
          return newZ;
        });
      }
      lastTouchDist.current = dist;
    }
  }, [containerRef]);

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    lastTouchDist.current = null;
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  return {
    zoom, pan, setZoom, setPan,
    zoomTo, smoothPanTo,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onWheel, onTouchStart, onTouchMove, onTouchEnd }
  };
}