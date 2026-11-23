import useSearchTelemetry from "./useSearchTelemetry";
import { useEffect, useMemo, useState } from "react";
import { RestaurantCatalog, RESTAURANT_CUISINES, sampleRestaurants } from "./domain";
import { serviceCss, Hero, Skeleton, Empty, HeartButton, Thumb } from "./ServiceShared";

const LOOK = {
  "Sarawak local": { emoji: "🍜", from: "#c2410c", to: "#fb923c" },
  Seafood: { emoji: "🦞", from: "#0369a1", to: "#38bdf8" },
  Indigenous: { emoji: "🍗", from: "#92400e", to: "#f59e0b" },
  Chinese: { emoji: "🥟", from: "#b91c1c", to: "#f87171" },
  Malay: { emoji: "🍢", from: "#a16207", to: "#facc15" },
  Vegetarian: { emoji: "🥗", from: "#15803d", to: "#4ade80" },
};
const DEFAULTS = { query: "", cuisine: "", maxLevel: 3, dietary: "", sort: "recommended" };

export default function RestaurantPage({ items = sampleRestaurants, user, onLogout, onBack, onBook }) {
  const [filters, setFilters] = useState(DEFAULTS);
  useSearchTelemetry(user, "restaurant", filters);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const catalog = useMemo(() => new RestaurantCatalog(items), [items]);
  const results = useMemo(() => catalog.search(filters), [catalog, filters]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800); // replace with your real loading state
    return () => clearTimeout(t);
  }, []);

  const set = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: name === "maxLevel" ? Number(value) : value }));
  };
  const toggleSaved = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div style={{ "--g1": "#7c2d12", "--g2": "#ea580c", "--accent": "#ea580c" }}>
      <style>{serviceCss}</style>
      <Hero eyebrow="Taste of Sarawak" title="Find a place to eat" lead="Search Sarawak eateries by town, cuisine or name."
        user={user} onBack={onBack} onLogout={onLogout} />

      <main className="wrap">
        <section className="filters" aria-label="Search filters">
          <div>
            <label htmlFor="query">Town, cuisine or name</label>
            <input id="query" name="query" value={filters.query} onChange={set} placeholder="e.g. Kuching" />
          </div>
          <div>
            <label htmlFor="maxLevel">Price</label>
            <select id="maxLevel" name="maxLevel" value={filters.maxLevel} onChange={set}>
              <option value={3}>Any price</option>
              <option value={1}>Under RM20</option>
              <option value={2}>Up to RM50</option>
            </select>
          </div>
          <div>
            <label htmlFor="dietary">Dietary</label>
            <select id="dietary" name="dietary" value={filters.dietary} onChange={set}>
              <option value="">Any</option>
              <option>Halal</option><option>Vegetarian</option><option>Vegan</option>
            </select>
          </div>
        </section>

        <div className="chips" role="group" aria-label="Cuisine">
          {["All", ...RESTAURANT_CUISINES].map((c) => (
            <button key={c} className="chip" aria-pressed={(filters.cuisine || "All") === c}
              onClick={() => setFilters((f) => ({ ...f, cuisine: c === "All" ? "" : c }))}>{c}</button>
          ))}
        </div>

        <div className="bar">
          <p aria-live="polite" key={loading ? "l" : results.length}>
            {loading ? "Searching…" : <><b>{results.length}</b> {results.length === 1 ? "restaurant" : "restaurants"} found</>}
          </p>
          <select name="sort" value={filters.sort} onChange={set} aria-label="Sort results">
            <option value="recommended">Top rated</option>
            <option value="priceLow">Price: low to high</option>
            <option value="priceHigh">Price: high to low</option>
          </select>
        </div>

        {loading ? <Skeleton /> : results.length === 0 ? (
          <Empty onClear={() => setFilters(DEFAULTS)}>No restaurants match these filters. Try another cuisine or price.</Empty>
        ) : (
          <div className="grid">
            {results.map((r, i) => {
              const look = LOOK[r.cuisine] ?? LOOK.Seafood;
              return (
                <article className="card" key={r.id} style={{ animationDelay: `${i * 70}ms` }}>
                  <Thumb image={r.image} alt={r.name} emoji={look.emoji} from={look.from} to={look.to} badge={r.cuisine} top={r.rating >= 4.7}>
                    <HeartButton on={saved.includes(r.id)} label={`Save ${r.name}`} onClick={() => toggleSaved(r.id)} />
                  </Thumb>
                  <div className="body">
                    <h3>{r.name}</h3>
                  <p style={{ color: r.verificationStatus === "Verified" ? "#17633c" : "#8a5600", fontSize: 14 }}>{r.verificationStatus ?? "Verification overdue"}</p>
                    <p className="loc">{r.location.toString()} · {r.hours}</p>
                    <div className="tags">{[...r.dietary, ...r.features].map((f) => <span key={f}>{f}</span>)}</div>
                    <div className="row">
                      <span className="price"><strong>{r.priceLabel}</strong></span>
                      <span className="meta"><b>★ {r.rating}</b>rated</span>
                    </div>
                  <button className="book" onClick={() => onBook?.(r)}>Reserve a table</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
