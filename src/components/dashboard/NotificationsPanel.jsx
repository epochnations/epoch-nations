import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, AlertTriangle, TrendingDown, Package, Swords, Zap, CheckCircle } from "lucide-react";

const SEV_CONFIG = {
  info: { color: "text-blue-400", border: "border-blue-400/30", bg: "bg-blue-400/10" },
  warning: { color: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10" },
  danger: { color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/10" },
  success: { color: "text-green-400", border: "border-green-400/30", bg: "bg-green-400/10" },
};

const TYPE_ICON = {
  stock_drop: TrendingDown,
  ally_aid: Package,
  war_declared: Swords,
  market_crash: AlertTriangle,
  tech_unlocked: Zap,
  lend_lease: Package,
  attack_received: Swords,
};

export default function NotificationsPanel({ nationId, ownerEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!ownerEmail) return;
    loadNotifications();
    const unsub = base44.entities.Notification.subscribe(() => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => loadNotifications(), 3000);
    });
    return () => {
      unsub();
      clearTimeout(debounceRef.current);
    };
  }, [ownerEmail]);

  async function loadNotifications() {
    const data = await base44.entities.Notification.filter(
      { target_owner_email: ownerEmail },
      "-created_date",
      20
    );
    setNotifications(data);
    setUnread(data.filter(n => !n.is_read).length);
  }

  async function markAllRead() {
    const unreadItems = notifications.filter(n => !n.is_read);
    await Promise.all(unreadItems.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setUnread(0);
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Bell size={16} className="text-slate-300" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Notifications</span>
            <button onClick={() => setOpen(false)}>
              <X size={14} className="text-slate-400 hover:text-white" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">All clear 🎯</div>
            ) : (
              notifications.map(n => {
                const cfg = SEV_CONFIG[n.severity] || SEV_CONFIG.info;
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <div key={n.id} className={`px-4 py-3 ${n.is_read ? "opacity-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon size={12} className={cfg.color} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">{n.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{n.message}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}