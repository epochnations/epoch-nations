/**
 * MapEngine – core pan/zoom canvas-style map built on SVG + transform.
 * Handles smooth zoom, pan, touch gestures, and coordinate transforms.
 */
import { useState, useRef, useEffect, useCallback } from "react";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.25;

const PAN_STORAGE_KEY = "epoch_map_pan";
const ZOOM_STORAGE_KEY = "epoch_map_zoom";

function loadSavedView() {
  try {
    const z = parseFloat(localStorage.getItem(ZOOM_STORAGE_KEY));
    const p = JSON.parse(localStorage.getItem(PAN_STORAGE_KEY));
    return { zoom: isNaN(z) ? 0.85 : z, pan: p || { x: 0, y: 0 } };
  } catch { return { zoom: 0.85, pan: { x: 0, y: 0 } }; }
}

export function useMapEngine(containerRef) {
  const saved = loadSavedView();
  const [zoom, setZoom] = useState(saved.zoom);
  const [pan, setPan] = useState(saved.pan);

  // Smooth zoom animation
  const targetZoomRef = useRef(saved.zoom);
  const currentZoomRef = useRef(saved.zoom);
  const zoomAnimRef = useRef(null);
  const zoomCenterRef = useRef({ x: 0, y: 0 });
  const panRef = useRef(saved.pan);

  const saveTimer = useRef(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const animFrame = useRef(null);

  // Keep panRef in sync
  useEffect(() => { panRef.current = pan; }, [pan]);

  const savePan = useCallback((p, z) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(PAN_STORAGE_KEY, JSON.stringify(p));
      localStorage.setItem(ZOOM_STORAGE_KEY, String(z));
    }, 300);
  }, []);

  // Smooth zoom animation loop
  const startZoomAnimation = useCallback(() => {
    cancelAnimationFrame(zoomAnimRef.current);
    const animate = () => {
      const target = targetZoomRef.current;
      const current = currentZoomRef.current;
      const diff = target - current;
      if (Math.abs(diff) < 0.001) {
        currentZoomRef.current = target;
        setZoom(target);
        return;
      }
      const next = current + diff * 0.14;
      const ratio = next / current;
      const cx = zoomCenterRef.current.x;
      const cy = zoomCenterRef.current.y;
      currentZoomRef.current = next;
      setZoom(next);
      setPan(p => {
        const np = { x: cx - ratio * (cx - p.x), y: cy - ratio * (cy - p.y) };
        savePan(np, next);
        return np;
      });
      zoomAnimRef.current = requestAnimationFrame(animate);
    };
    zoomAnimRef.current = requestAnimationFrame(animate);
  }, [savePan]);

  const zoomTo = useCallback((newZoom, centerX, centerY) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    zoomCenterRef.current = { x: centerX, y: centerY };
    targetZoomRef.current = clamped;
    startZoomAnimation();
  }, [startZoomAnimation]);

  const smoothPanTo = useCallback((targetPx, targetPy, currentZoom) => {
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

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => {
      const np = { x: p.x + dx, y: p.y + dy };
      savePan(np, currentZoomRef.current);
      return np;
    });
  }, [savePan]);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newTarget = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoomRef.current + delta));
    zoomCenterRef.current = { x: cx, y: cy };
    targetZoomRef.current = newTarget;
    startZoomAnimation();
  }, [containerRef, startZoomAnimation]);

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
        const newTarget = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoomRef.current * ratio));
        zoomCenterRef.current = { x: cx, y: cy };
        targetZoomRef.current = newTarget;
        startZoomAnimation();
      }
      lastTouchDist.current = dist;
    }
  }, [containerRef, startZoomAnimation]);

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    lastTouchDist.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrame.current);
      cancelAnimationFrame(zoomAnimRef.current);
      clearTimeout(saveTimer.current);
    };
  }, []);

  return {
    zoom, pan, setZoom: (z) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, typeof z === 'function' ? z(targetZoomRef.current) : z));
      // For button-based zoom, use center of container
      const container = containerRef.current;
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        zoomCenterRef.current = { x: width / 2, y: height / 2 };
      }
      targetZoomRef.current = clamped;
      startZoomAnimation();
    },
    setPan,
    zoomTo, smoothPanTo,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onWheel, onTouchStart, onTouchMove, onTouchEnd }
  };
}