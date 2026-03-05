import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Upload, Music, FileText, Scale, Globe, Building } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Globe },
  { id: "government", label: "Government", icon: Building },
  { id: "laws", label: "Laws", icon: Scale },
  { id: "culture", label: "Culture", icon: Music },
  { id: "media", label: "Media", icon: FileText },
];

export default function NationWikiPanel({ nation, onRefresh }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [uploadingFlag, setUploadingFlag] = useState(false);
  const [uploadingAnthem, setUploadingAnthem] = useState(false);

  const [fields, setFields] = useState({
    nation_description: nation.nation_description || "",
    nation_constitution: nation.nation_constitution || "",
    nation_bylaws: nation.nation_bylaws || "",
    government_structure: nation.government_structure || "",
    culture_notes: nation.culture_notes || "",
  });

  async function save() {
    setSaving(true);
    await base44.entities.Nation.update(nation.id, fields);
    setSaving(false);
    onRefresh?.();
  }

  async function handleFlagUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFlag(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Nation.update(nation.id, { flag_image_url: file_url });
    setUploadingFlag(false);
    onRefresh?.();
  }

  async function handleAnthemUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAnthem(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Nation.update(nation.id, { anthem_url: file_url });
    setUploadingAnthem(false);
    onRefresh?.();
  }

  const TextArea = ({ field, label, placeholder, rows = 5 }) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">{label}</label>
      <textarea
        rows={rows}
        value={fields[field]}
        onChange={e => setFields(prev => ({ ...prev, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-cyan-500/50 transition-colors"
      />
    </div>
  );

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Wiki Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5">

        {activeTab === "overview" && (
          <>
            {/* Flag Upload */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">Nation Flag Image</label>
              <div className="flex items-center gap-4">
                {nation.flag_image_url ? (
                  <img src={nation.flag_image_url} alt="Flag" className="w-20 h-14 object-cover rounded-xl border border-white/20" />
                ) : (
                  <div className="w-20 h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-2xl">
                    {nation.flag_emoji || "🏴"}
                  </div>
                )}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all">
                  <Upload size={12} />
                  {uploadingFlag ? "Uploading..." : "Upload Flag Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFlagUpload} disabled={uploadingFlag} />
                </label>
              </div>
            </div>
            <TextArea field="nation_description" label="Nation Description" placeholder="Describe your nation's history, geography, and character..." rows={6} />
          </>
        )}

        {activeTab === "government" && (
          <TextArea field="government_structure" label="Government Structure" placeholder="Describe your government type, branches, leadership, and political system..." rows={10} />
        )}

        {activeTab === "laws" && (
          <>
            <TextArea field="nation_constitution" label="Constitution" placeholder="Write your nation's constitution — founding principles, rights, and governance rules..." rows={8} />
            <TextArea field="nation_bylaws" label="Bylaws" placeholder="Specific laws, regulations, and rules governing your nation..." rows={8} />
          </>
        )}

        {activeTab === "culture" && (
          <TextArea field="culture_notes" label="Culture & Society" placeholder="Describe your nation's culture, traditions, values, cuisine, art, and way of life..." rows={10} />
        )}

        {activeTab === "media" && (
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">National Anthem</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all">
                <Music size={12} />
                {uploadingAnthem ? "Uploading..." : "Upload Anthem (Audio)"}
                <input type="file" accept="audio/*" className="hidden" onChange={handleAnthemUpload} disabled={uploadingAnthem} />
              </label>
            </div>
            {nation.anthem_url && (
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-2">Current Anthem:</div>
                <audio controls src={nation.anthem_url} className="w-full" />
              </div>
            )}
          </div>
        )}

        {activeTab !== "media" && (
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}