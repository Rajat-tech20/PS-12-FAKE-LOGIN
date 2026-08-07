import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ManageColleges() {
  const [colleges, setColleges] = useState([]);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data, error } = await supabase.from("colleges").select("*").order("name");
      if (!error) setColleges(data || []);
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("colleges").insert({ slug, name });
    if (error) { setError(error.message); return; }
    setSlug(""); setName("");
    load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="m3-display-large">Manage Registered Colleges</h1>
        <p className="m3-body-medium" style={{ marginTop: 4 }}>
          Super-admin university & college organizational hierarchy management
        </p>
      </div>

      <div className="m3-card">
        <h3 className="m3-title-medium" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "var(--md-sys-color-primary)" }}>domain_add</span>
          Add New College Entity
        </h3>
        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 16, alignItems: "end" }}>
          <div className="m3-input-field">
            <label>Slug Identifier</label>
            <input className="m3-input" placeholder="e.g. st-vincent-pallotti" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
          <div className="m3-input-field">
            <label>Full College / Institution Name</label>
            <input className="m3-input" placeholder="e.g. St. Vincent Pallotti College of Engineering" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button type="submit" className="m3-btn m3-btn-filled" style={{ height: 46 }}>
            <span className="material-symbols-outlined">add</span>
            Add College
          </button>
        </form>
        {error && (
          <div className="m3-chip m3-chip-danger" style={{ marginTop: 12 }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}
      </div>

      <div className="m3-table-container">
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--md-sys-color-primary)" }}>sync</span>
            <p className="m3-body-medium" style={{ marginTop: 12 }}>Loading college database...</p>
          </div>
        ) : (
          <table className="m3-table">
            <thead>
              <tr>
                <th>Slug Identifier</th>
                <th>Full College Name</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="m3-chip" style={{ fontFamily: "Roboto Mono", fontSize: 12 }}>{c.slug}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: "var(--md-sys-color-on-surface-variant)", fontSize: 13 }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
