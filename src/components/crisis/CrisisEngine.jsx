/**
 * CrisisEngine — Headless component.
 * Periodically spawns crisis events based on nation stability, war status, etc.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "../game/GameClock";

const CRISIS_POOL = [
  { crisis_type:"riot",                   severity_weights:[0.3,0.5,0.15,0.05], title:"Civil unrest erupts in the streets" },
  { crisis_type:"fire",                   severity_weights:[0.4,0.4,0.15,0.05], title:"Major fire breaks out in industrial district" },
  { crisis_type:"crime_wave",             severity_weights:[0.35,0.45,0.15,0.05], title:"Crime wave hits major city centers" },
  { crisis_type:"power_outage",           severity_weights:[0.5,0.35,0.1,0.05],  title:"Power grid failure leaves millions in dark" },
  { crisis_type:"infrastructure_failure", severity_weights:[0.3,0.4,0.25,0.05],  title:"Critical infrastructure damage reported" },
  { crisis_type:"flood",                  severity_weights:[0.25,0.4,0.3,0.05],  title:"Flash flooding sweeps through lowlands" },
];
const SEVS = ["minor","moderate","major","catastrophic"];

function pickSeverity(weights) {
  const r = Math.random();
  let cum = 0;
  for (let i=0; i<weights.length; i++) { cum += weights[i]; if (r < cum) return SEVS[i]; }
  return "minor";
}

const SEVERITY_IMPACT = {
  minor:        { stability:-2,  gdp:-50  },
  moderate:     { stability:-8,  gdp:-200 },
  major:        { stability:-20, gdp:-600 },
  catastrophic: { stability:-40, gdp:-2000 },
};

export default function CrisisEngine({ nation, onCrisis }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    // Run every 15 minutes; crisis chance depends on stability
    timerRef.current = setInterval(() => maybeTriggerCrisis(), 15 * TICK_MS);
    return () => clearInterval(timerRef.current);
  }, [nation?.id]);

  async function maybeTriggerCrisis() {
    const fresh = (await base44.entities.Nation.filter({ owner_email: nation.owner_email }))[0];
    if (!fresh) return;
    const stability = fresh.stability || 75;
    const atWar = (fresh.at_war_with || []).length > 0;
    // Base chance 3%; lower stability increases it; war adds 5%
    const crisisChance = 0.03 + Math.max(0, (50 - stability) / 500) + (atWar ? 0.05 : 0);
    if (Math.random() > crisisChance) return;

    // Pick event
    const evt = CRISIS_POOL[Math.floor(Math.random() * CRISIS_POOL.length)];
    const sev = pickSeverity(evt.severity_weights);
    const impact = SEVERITY_IMPACT[sev];

    const existing = await base44.entities.CrisisEvent.filter({ nation_id: fresh.id }).catch(()=>[]);
    const active = existing.filter(c => c.status === "active" || c.status === "responding");
    if (active.length >= 3) return; // cap at 3 concurrent

    await base44.entities.CrisisEvent.create({
      nation_id: fresh.id, owner_email: fresh.owner_email,
      crisis_type: evt.crisis_type, severity: sev,
      title: evt.title, description: `A ${sev} ${evt.crisis_type.replace(/_/g,' ')} event is unfolding.`,
      status:"active", response_units:[], stability_impact: impact.stability, gdp_impact: impact.gdp,
      response_cost: sev === "catastrophic" ? 2000 : sev === "major" ? 800 : sev === "moderate" ? 300 : 100,
    });

    await base44.entities.Nation.update(fresh.id, {
      stability: Math.min(100, Math.max(0, stability + impact.stability)),
      gdp: Math.max(100, (fresh.gdp||500) + impact.gdp),
    });

    await base44.entities.Notification.create({
      target_owner_email: fresh.owner_email, target_nation_id: fresh.id,
      type:"attack_received", title:`🚨 Crisis: ${evt.title}`,
      message:`A ${sev} crisis requires your response! Open the Crisis Panel.`,
      severity: sev === "catastrophic" || sev === "major" ? "danger" : "warning", is_read:false,
    }).catch(()=>{});

    onCrisis?.();
  }

  return null;
}