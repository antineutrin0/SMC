import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";


export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  debounce = 300,
  className = "",
}) {
  const [internal, setInternal] = useState(value ?? "");
  const timerRef = useRef(null);

  useEffect(() => {
    setInternal(value ?? "");
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setInternal(raw);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(raw), debounce);
  };

  const handleClear = () => {
    setInternal("");
    clearTimeout(timerRef.current);
    onChange("");
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={`relative w-full max-w-sm ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// useSearch — generic text-only filter hook.
// Used by MedicineList (unchanged).
// ─────────────────────────────────────────────────────────────
export function useSearch(data = [], accessors = []) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) =>
      accessors.some((fn) => {
        const val = fn(item);
        if (!val || typeof val !== "string") return false;
        return val.toLowerCase().includes(q);
      }),
    );
  }, [data, query, accessors]);

  return { query, setQuery, filtered };
}

// ─────────────────────────────────────────────────────────────
// toLocalDateStr — converts any date value to "YYYY-MM-DD"
// using the browser's LOCAL timezone (not UTC).
//
// This is the key fix: new Date("2026-05-02T00:00:00+06:00")
//   .toISOString()      → "2026-05-01T18:00:00Z"  ❌ wrong day in UTC
//   toLocalDateStr()    → "2026-05-02"             ✅ correct local day
// ─────────────────────────────────────────────────────────────
function toLocalDateStr(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // "YYYY-MM-DD"
}

// ─────────────────────────────────────────────────────────────
// useVisitFilter — combined doctor name + date filter.
//
// `date` is a "YYYY-MM-DD" string from <input type="date">
// or "" when empty.
//
// Both the input value and visit_date are converted to local
// "YYYY-MM-DD" strings before comparing, so timezone shifts
// never cause off-by-one day mismatches.
//
// Behaviour:
//   • Only query  → filter by doctor name
//   • Only date   → filter by date
//   • Both        → must match both (AND logic)
//   • Neither     → return all visits
// ─────────────────────────────────────────────────────────────
export function useVisitFilter(visits = []) {
  const [query, setQuery] = useState("");
  const [date,  setDate]  = useState(""); // "YYYY-MM-DD" or ""

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return visits.filter((v) => {
      // ── Doctor name filter ──────────────────────────────
      const nameMatch =
        q === "" ||
        (v.doctor_name ?? "").toLowerCase().includes(q);

      // ── Date filter (local timezone safe) ───────────────
      let dateMatch = true;
      if (date !== "") {
        // Convert visit_date using local time parts — never UTC
        const visitLocalStr = toLocalDateStr(v.visit_date);
        dateMatch = visitLocalStr === date;
      }
      return nameMatch && dateMatch;
    });
  }, [visits, query, date]);

  const isFiltering = query.trim() !== "" || date !== "";

  return { query, setQuery, date, setDate, filtered, isFiltering };
}