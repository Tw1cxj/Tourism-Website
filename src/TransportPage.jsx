import { useEffect, useMemo, useState } from "react";
import { TransportCatalog, TRANSPORT_TYPES, sampleTransport } from "./domain";
import { serviceCss, Hero, Skeleton, Empty, HeartButton, Thumb } from "./serviceShared";

const LOOK = {
  "Express bus": { emoji: "🚌", from: "#1d4ed8", to: "#38bdf8" },
  "E-hailing": { emoji: "🚖", from: "#0f766e", to: "#2dd4bf" },
};
const DEFAULTS = { query: "", type: "", maxPrice: 100, seats: 1, sort: "recommended" };

export default function TransportPage({ items = sampleTransport, user, onLogout, onBack }) {
  const [filters, setFilters] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const catalog = useMemo(() => new TransportCatalog(items), [items]);
  const results = useMemo(() => catalog.search(filters), [catalog, filters]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800); // replace with your real loading state
    return () => clearTimeout(t);
  }, []);

  const set = (e) => {
    const { name, value, type } = e.target;
    setFilters((f) => ({ ...f, [name]: type === "number" || type === "range" ? Number(value) : value }));
  };
  const toggleSaved = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div style={{ "--g1": "#0f3b46", "--g2": "#0d9488", "--accent": "#0d9488" }}>
      <style>{serviceCss}</style>
      <Hero eyebrow="Get around Sarawak" title="Find your ride" lead="Express buses between towns and E-hailing rides in the city."
        user={user} onBack={onBack} onLogout={onLogout} />

      <main className="wrap">
        <section className="filters" aria-label="Search filters">
          <div>
            <label htmlFor="query">Town or route</label>
            <input id="query" name="query" value={filters.query} onChange={set} placeholder="e.g. Kuching" />
          </div>
          <div>
            <label htmlFor="seats">Passengers</label>
            <input id="seats" name="seats" type="number" min="1" max="40" value={filters.seats} onChange={set} />
          </div>
          <div>
            <label htmlFor="maxPrice">Max price <span className="price-val">RM{filters.maxPrice}</span></label>
            <input id="maxPrice" name="maxPrice" type="range" min="5" max="100" step="5" value={filters.maxPrice} onChange={set} />
          </div>
        </section>

        <div className="chips" role="group" aria-label="Transport type">
          {["All", ...TRANSPORT_TYPES].map((t) => (
            <button key={t} className="chip" aria-pressed={(filters.type || "All") === t}
              onClick={() => setFilters((f) => ({ ...f, type: t === "All" ? "" : t }))}>{t}</button>
          ))}
        </div>

        <div className="bar">
          <p aria-live="polite" key={loading ? "l" : results.length}>
            {loading ? "Searching…" : <><b>{results.length}</b> {results.length === 1 ? "option" : "options"} found</>}
          </p>
          <select name="sort" value={filters.sort} onChange={set} aria-label="Sort results">
            <option value="recommended">Top rated</option>
            <option value="priceLow">Price: low to high</option>
            <option value="priceHigh">Price: high to low</option>
          </select>
        </div>

        {loading ? <Skeleton /> : results.length === 0 ? (
          <Empty onClear={() => setFilters(DEFAULTS)}>Nothing matches these filters. Try another town or a higher price.</Empty>
        ) : (
          <div className="grid">
            {results.map((t, i) => {
              const look = LOOK[t.type] ?? LOOK["Express bus"];
              return (
                <article className="card" key={t.id} style={{ animationDelay: `${i * 70}ms` }}>
                  <Thumb image={t.image} alt={t.name} emoji={look.emoji} from={look.from} to={look.to} badge={t.type} top={t.rating >= 4.7}>
                    <HeartButton on={saved.includes(t.id)} label={`Save ${t.name}`} onClick={() => toggleSaved(t.id)} />
                  </Thumb>
                  <div className="body">
                    <h3>{t.name}</h3>
                    <p className="loc">{t.location.toString()}</p>
                    <div className="tags">{t.features.map((f) => <span key={f}>{f}</span>)}</div>
                    <div className="row">
                      <span className="price"><strong>RM{t.price}</strong> <span>/ {t.priceUnit}</span></span>
                      <span className="meta"><b>★ {t.rating}</b>up to {t.capacity}</span>
                    </div>
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
