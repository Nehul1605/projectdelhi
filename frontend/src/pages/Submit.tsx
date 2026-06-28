import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addTask, getCurrentUser } from "../store";
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
  const currentUser = getCurrentUser();

  const [applicantType, setApplicantType] =
    useState<ApplicantType>("individual");
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([28.6139, 77.209]); // Delhi coords
  const [addressLine, setAddressLine] = useState("");
  const [pincode, setPincode] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
        organizationType:
          applicantType === "group" ? get("organizationType") : undefined,
        designation:
          applicantType === "group" ? get("designation") : undefined,
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

      addToast("Your proposal has been submitted!", "success");
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
                Individual
              </div>
              <div
                className={`radio-option ${applicantType === "group" ? "selected" : ""}`}
                onClick={() => setApplicantType("group")}
              >
                Organization
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

          {applicantType === "group" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="organizationName">
                    Organization Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    id="organizationName"
                    required
                    placeholder="e.g. Save Delhi Foundation"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="organizationType">
                    Organization Type <span className="required">*</span>
                  </label>
                  <select
                    name="organizationType"
                    id="organizationType"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>Select organization type</option>
                    <option value="Corporate">Corporate</option>
                    <option value="NGO / NPO">NGO / NPO</option>
                    <option value="Government">Government</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="designation">
                    Your Designation <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="designation"
                    id="designation"
                    required
                    placeholder="e.g. President, Secretary"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                placeholder="name@example.com"
                defaultValue={currentUser?.email || ""}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                required
                placeholder="+91 XXXXX XXXXX"
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
            <label style={{ display: "block", marginBottom: "8px" }}>
              Category <span className="required">*</span>
            </label>
            <input type="hidden" name="category" value={selectedCategory} required />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {categories.map(([key, meta]) => {
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className="filter-chip"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "24px",
                      cursor: "pointer",
                      fontSize: "0.88rem",
                      fontWeight: isSelected ? 700 : 500,
                      transition: "all 0.2s ease",
                      border: isSelected ? "1.5px solid var(--primary)" : "1.5px solid var(--border-light)",
                      background: isSelected ? "var(--primary)" : "#ffffff",
                      color: isSelected ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: isSelected ? "0 4px 12px rgba(140, 36, 36, 0.15)" : "none",
                      transform: isSelected ? "scale(1.03)" : "scale(1)"
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
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
              <label htmlFor="eventDate">Date <span className="required">*</span></label>
              <input type="date" name="eventDate" id="eventDate" required />
            </div>
            <div className="form-group">
              <label htmlFor="eventTime">Time <span className="required">*</span></label>
              <input type="time" name="eventTime" id="eventTime" required />
            </div>
            <div className="form-group">
              <label htmlFor="volunteersNeeded">Volunteers Needed <span className="required">*</span></label>
              <input
                type="number"
                name="volunteersNeeded"
                id="volunteersNeeded"
                required
                min="1"
                placeholder="e.g. 15"
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
                    color: "var(--text-muted)",
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
                  background: "var(--bg-card)",
                  zIndex: 1000,
                  boxShadow: "var(--shadow-lg)",
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
                          : "1px solid var(--border-light)",
                      display: "flex",
                      gap: "12px",
                      alignItems: "start",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-warm)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--bg-card)")
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
                    <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
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
            {submitting ? "Submitting..." : "Raise Proposal"}
          </button>
        </form>
      </div>
    </div>
  );
}
