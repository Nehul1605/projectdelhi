import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addTask } from "../store";
import { TaskCategory, ApplicantType, CATEGORY_META } from "../types";
import { Search, MapPin, Loader2 } from "lucide-react";
import debounce from "lodash/debounce";

// Fix Leaflet marker icon issue
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
  };
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

export default function Submit({ addToast }: Props) {
  const navigate = useNavigate();

  const [applicantType, setApplicantType] =
    useState<ApplicantType>("individual");
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([28.6139, 77.209]); // Delhi coords
  const [addressLine, setAddressLine] = useState("");
  const [pincode, setPincode] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestionsRef = useRef(
    debounce(async (query: string) => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=in&viewbox=76.8,28.9,77.4,28.4&bounded=1`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await resp.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggestions fetch failed", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500),
  );

  useEffect(() => {
    return () => {
      fetchSuggestionsRef.current.cancel();
    };
  }, []);

  const onAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressLine(val);
    fetchSuggestionsRef.current(val);
  };

  const selectSuggestion = (s: Suggestion) => {
    setAddressLine(s.display_name);
    setCoords([parseFloat(s.lat), parseFloat(s.lon)]);
    if (s.address?.postcode) setPincode(s.address.postcode);
    setShowSuggestions(false);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && !target.closest(".location-search-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleManualLookup = async () => {
    if (!addressLine && !pincode) return;
    setLoadingSuggestions(true);
    const query = `${addressLine} ${pincode} Delhi India`.trim();
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&viewbox=76.8,28.9,77.4,28.4&bounded=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await resp.json();
      if (data && data.length > 0) {
        const newCoords: [number, number] = [
          parseFloat(data[0].lat),
          parseFloat(data[0].lon),
        ];
        setCoords(newCoords);
        setAddressLine(data[0].display_name);
        addToast("Location updated on map", "info");
      } else {
        addToast("Exact location not found, but you can still submit.", "info");
      }
    } catch (err) {
      console.error("Manual lookup error", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => ((fd.get(k) as string) || "").trim();

    try {
      addTask({
        title: get("title"),
        description: get("description"),
        category: get("category") as TaskCategory,
        applicantType,
        applicantName: get("applicantName"),
        organizationName:
          applicantType === "group" ? get("organizationName") : undefined,
        email: get("email"),
        phone: get("phone"),
        address: addressLine,
        locality: get("locality"),
        city: get("city") || "New Delhi",
        pincode: pincode,
        eventDate: get("eventDate"),
        eventTime: get("eventTime"),
        volunteersNeeded: parseInt(get("volunteersNeeded")) || 10,
      });

      addToast("Your proposal has been submitted! 🎉", "success");
      navigate("/");
    } catch {
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = Object.entries(CATEGORY_META) as [
    TaskCategory,
    (typeof CATEGORY_META)[TaskCategory],
  ][];

  return (
    <div className="container page-section">
      <div className="section-header">
        <h2>Raise a Proposal</h2>
        <p>
          Submit your community initiative. Location accuracy helps volunteers
          find you easily.
        </p>
      </div>

      <div
        className="card"
        style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}
      >
        <form onSubmit={handleSubmit}>
          {/* Applicant Info (Shortened for brevity in this log) */}
          <div className="form-group">
            <label>
              Applying as <span className="required">*</span>
            </label>
            <div className="radio-group">
              <div
                className={`radio-option ${applicantType === "individual" ? "selected" : ""}`}
                onClick={() => setApplicantType("individual")}
              >
                🙋 Individual
              </div>
              <div
                className={`radio-option ${applicantType === "group" ? "selected" : ""}`}
                onClick={() => setApplicantType("group")}
              >
                👥 Organization
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="applicantName">
                Your Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="applicantName"
                id="applicantName"
                required
                placeholder="Full Name"
              />
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border-light)",
              margin: "24px 0",
            }}
          />

          {/* Task Details */}
          <div className="form-group">
            <label htmlFor="title">
              Initiative Title <span className="required">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              placeholder="e.g. Yamuna Cleanup"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">
              Category <span className="required">*</span>
            </label>
            <select name="category" id="category" required>
              <option value="">Select a category</option>
              {categories.map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.emoji} {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              name="description"
              id="description"
              required
              rows={4}
              placeholder="What, where, and why?"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="eventDate">Date</label>
              <input type="date" name="eventDate" id="eventDate" required />
            </div>
            <div className="form-group">
              <label htmlFor="eventTime">Time</label>
              <input type="time" name="eventTime" id="eventTime" required />
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border-light)",
              margin: "24px 0",
            }}
          />

          {/* LOCATION ENHANCEMENT */}
          <div
            className="form-group location-search-container"
            style={{ position: "relative" }}
          >
            <label htmlFor="address">
              Full Address / Location Search <span className="required">*</span>
            </label>
            <div style={{ position: "relative", display: "flex", gap: "8px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  id="address"
                  required
                  placeholder="Search for a building, street, or area in Delhi..."
                  value={addressLine}
                  onChange={onAddressChange}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                  style={{ paddingLeft: "40px" }}
                />
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                {loadingSuggestions && (
                  <Loader2
                    className="animate-spin"
                    size={18}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--primary)",
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleManualLookup}
                style={{
                  padding: "0 16px",
                  borderRadius: "8px",
                  background: "var(--primary)",
                  color: "white",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  height: "44px",
                }}
              >
                <MapPin size={16} /> Locate
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "white",
                  zIndex: 1000,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  borderRadius: "12px",
                  marginTop: "8px",
                  border: "1px solid var(--border)",
                  maxHeight: "250px",
                  overflowY: "auto",
                }}
                onMouseLeave={() => setShowSuggestions(false)}
              >
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom:
                        i === suggestions.length - 1
                          ? "none"
                          : "1px solid #f0f0f0",
                      display: "flex",
                      gap: "12px",
                      alignItems: "start",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8f9fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <MapPin
                      size={16}
                      style={{
                        marginTop: "3px",
                        color: "var(--primary)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#444" }}>
                      {s.display_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="locality">Locality</label>
              <input
                type="text"
                name="locality"
                id="locality"
                required
                placeholder="e.g. Rohini Sector 7"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pincode">Pincode</label>
              <input
                type="text"
                name="pincode"
                id="pincode"
                required
                placeholder="1100XX"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                onBlur={handleManualLookup}
              />
            </div>
          </div>

          <div
            className="form-group"
            style={{
              height: "320px",
              marginBottom: "24px",
              borderRadius: "16px",
              overflow: "hidden",
              border: "2px solid var(--primary-light)",
            }}
          >
            <MapContainer
              center={coords}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker position={coords} />
              <MapUpdater center={coords} />
            </MapContainer>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "🚀 Raise Proposal"}
          </button>
        </form>
      </div>
    </div>
  );
}
