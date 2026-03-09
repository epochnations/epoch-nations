import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function EventsPanel({ city, events, onRefresh }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [resolving, setResolving] = useState(false);

  const severityColors = {
    low: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    high: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    critical: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  const iconMap = {
    crime: "🚨",
    disease: "🦠",
    fire: "🔥",
    protest: "✊",
    achievement: "🏆",
    disaster: "⚠️",
    immigration: "👥",
    emigration: "🚪",
    complaint: "😤",
  };

  async function resolveEvent(eventId, resolution) {
    setResolving(true);
    await base44.entities.CityEvent.update(eventId, {
      is_resolved: true,
      resolution,
    });
    setSelectedEvent(null);
    onRefresh?.();
    setResolving(false);
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="ep-card p-8 text-center border border-green-500/30 bg-green-500/10">
          <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
          <p className="text-sm text-green-300">All clear! No active events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`ep-card p-4 border text-left w-full transition-all hover:brightness-110 ${severityColors[event.severity]}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{iconMap[event.event_type]}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm mb-1">{event.title}</div>
                  <p className="text-xs opacity-80 mb-2">{event.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="uppercase font-bold tracking-wider">{event.severity}</span>
                    <span className="text-slate-500">Click to resolve</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="ep-card max-w-md w-full p-6 border-white/20">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{iconMap[selectedEvent.event_type]}</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{selectedEvent.title}</h3>
                <p className="text-xs text-slate-400 capitalize">{selectedEvent.event_type}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4">{selectedEvent.description}</p>

            {selectedEvent.impact && Object.keys(selectedEvent.impact).length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4 space-y-1">
                <p className="text-xs font-bold text-slate-400 mb-2">Impact:</p>
                {Object.entries(selectedEvent.impact).map(([key, val]) => (
                  <p key={key} className={`text-xs ${val > 0 ? "text-green-400" : "text-red-400"}`}>
                    {key}: {val > 0 ? "+" : ""}{val}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10"
              >
                Close
              </button>
              <button
                onClick={() => resolveEvent(selectedEvent.id, "resolved")}
                disabled={resolving}
                className="flex-1 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/30 disabled:opacity-50"
              >
                {resolving ? "Resolving..." : "Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}