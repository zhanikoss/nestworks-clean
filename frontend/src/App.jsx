import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";

const ADDON_PRICES = { parking: 1500, coffee: 800, monitor: 1200 };
const ADDON_LABELS = {
  parking: { label: "Parking", icon: "🚗", desc: "+1,500 ₸/day" },
  coffee:  { label: "Coffee Sub", icon: "☕", desc: "+800 ₸/day" },
  monitor: { label: "Monitor", icon: "🖥️", desc: "+1,200 ₸/day" },
};

const SPACE_IMAGES = {
  1: "/images/focus.jpg",
  2: "/images/hive.jpg",
  3: "/images/garden.jpg",
  4: "/images/studio.jpg",
  5: "/images/loft.jpg",
  6: "/images/stage.jpg",
};

// ─── Tenge formatter ─────────────────────────────────────────────────────────
function fmt(n) { 
  return Math.round(n).toLocaleString() + " ₸"; 
}

function discount(plan) {
  if (plan === "weekly")  return 0.90;
  if (plan === "monthly") return 0.80;
  return 1.0;
}

function calcPrice(space, days, plan, addons) {
  const rawBase   = space.daily_rate * days;
  const discBase  = rawBase * discount(plan);
  const saving    = Math.round(rawBase - discBase);
  const addonCost = addons.reduce((s, a) => s + (ADDON_PRICES[a] || 0), 0) * days;
  const total     = Math.round(discBase + addonCost);
  return { rawBase: Math.round(rawBase), discBase: Math.round(discBase), saving, addonCost, total };
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ spaces, onBook, cartCount, onCartClick, onHistoryClick }) {
  const sortedSpaces = [...spaces].sort((a, b) => a.daily_rate - b.daily_rate);

  return (
    <div className="min-h-screen bg-surface">

      <header className="navbar">
        <span className="logo">NestWorks</span>
        <div className="flex gap-2">
          <button className="history-btn" onClick={onHistoryClick}>
            📋 History
          </button>
          <button className="cart-pill" onClick={onCartClick}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-text">
          <h1 className="hero-title">
            Find Your<br />
            <span className="text-accent">Perfect</span> Workspace
          </h1>
          <p className="hero-sub">
            Premium coworking spaces for creators and teams.
            Tap any space to configure your booking.
          </p>
        </div>
        <div className="hero-img-wrap">
          <img src="/images/hero.jpg" alt="NestWorks hero" className="hero-img" />
        </div>
      </section>

      <section className="px-6 pb-16">
        <p className="section-label">Available spaces — tap to configure &amp; book</p>
        <div className="spaces-grid">
          {sortedSpaces.map(space => (
            <div key={space.id} className="space-card">
              <div className="space-card-img-wrap">
                <img
                  src={SPACE_IMAGES[space.id] || "/images/hero.jpg"}
                  alt={space.name}
                  className="space-card-img"
                />
                <span className="space-type-badge">{space.type}</span>
              </div>
              <div className="space-card-body">
                <div>
                  <h3 className="space-name">{space.name}</h3>
                  <p className="space-cap">👥 Up to {space.capacity} people</p>
                  <ul className="space-features">
                    {(space.features || []).slice(0, 2).map(f => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="space-rate">
                    {fmt(space.daily_rate)} <span className="space-rate-sub">/day</span>
                  </p>
                  <button className="btn-primary w-full mt-3" onClick={() => onBook(space)}>
                    Configure &amp; book →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── BOOKING HISTORY PAGE ─────────────────────────────────────────────────────
function BookingHistory({ bookings, onClearHistory, onBack }) {
  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="navbar">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <span className="logo">NestWorks</span>
          <div style={{ width: 80 }} />
        </header>
        <div className="cart-layout">
          <div className="cart-empty">
            <p>📭 No bookings yet</p>
            <button className="btn-primary mt-4" onClick={onBack}>Book a space →</button>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = bookings.reduce((sum, b) => sum + b.total, 0);
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
  const cancelledCount = bookings.filter(b => b.status === "cancelled").length;

  return (
    <div className="min-h-screen bg-surface">
      <header className="navbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="logo">NestWorks</span>
        <button className="cart-pill" onClick={onClearHistory}>
          🗑️ Clear history
        </button>
      </header>

      <div className="cart-layout">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="cart-title">📋 Booking history</h2>
          <div className="flex gap-3 text-sm">
            <span className="text-green-600">✓ {confirmedCount} confirmed</span>
            <span className="text-red-500">✗ {cancelledCount} cancelled</span>
            <span className="text-gray-600">💰 {fmt(totalSpent)} total</span>
          </div>
        </div>

        {bookings.slice().reverse().map((booking, idx) => (
          <div key={idx} className={`cart-item ${booking.status === "cancelled" ? "opacity-60" : ""}`}>
            <div className="cart-item-img-placeholder">
              <span className="text-3xl">{booking.space.icon || "🏢"}</span>
            </div>
            <div className="cart-item-body flex-1">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="cart-item-name">{booking.space.name}</h3>
                  <p className="cart-item-meta">
                    {booking.days} days · {booking.plan} plan
                    {booking.addons?.length > 0 && " · " + booking.addons.map(a => ADDON_LABELS[a]?.label).join(", ")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    🕐 {new Date(booking.date).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="cart-item-price">{fmt(booking.total)}</p>
                  <span className={`status-badge ${booking.status === "confirmed" ? "status-confirmed" : "status-cancelled"}`}>
                    {booking.status === "confirmed" ? "✓ Confirmed" : "✗ Cancelled"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center text-xs text-gray-400 mt-4">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} · States: pending → confirmed/cancelled
        </div>
      </div>
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage({ cart, onRemove, onBack, onConfirm, confirmed, bookingId }) {
  const total = cart.reduce((s, item) => s + item.total, 0);

  return (
    <div className="min-h-screen bg-surface">
      <header className="navbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="logo">NestWorks</span>
        <div style={{ width: 80 }} />
      </header>

      <div className="cart-layout">
        <h2 className="cart-title">🛒 Your cart</h2>

        {cart.length === 0 && !confirmed && (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button className="btn-primary mt-4" onClick={onBack}>Browse spaces →</button>
          </div>
        )}

        {cart.map((item, i) => (
          <div key={i} className="cart-item">
            <img
              src={SPACE_IMAGES[item.space.id] || "/images/hero.jpg"}
              alt={item.space.name}
              className="cart-item-img"
            />
            <div className="cart-item-body">
              <h3 className="cart-item-name">{item.space.name}</h3>
              <p className="cart-item-meta">
                {item.days} days · {item.plan} plan · 👥 {item.space.capacity} people
                {item.addons?.length > 0 && " · " + item.addons.map(a => ADDON_LABELS[a]?.label).join(", ")}
              </p>
            </div>
            <div className="cart-item-right">
              <p className="cart-item-price">{fmt(item.total)}</p>
              <button className="cart-remove-btn" onClick={() => onRemove(i)}>✕ remove</button>
            </div>
          </div>
        ))}

        {cart.length > 0 && (
          <div className="cart-summary-card">
            <div className="summary-row">
              <span>{cart.length} booking(s)</span>
              <span />
            </div>
            <div className="summary-total mt-2">
              <span>Grand total</span>
              <span className="summary-total-val">{fmt(total)}</span>
            </div>
            <button className="btn-primary w-full mt-4" onClick={onConfirm}>
              Confirm all bookings →
            </button>
          </div>
        )}

        {confirmed && (
          <div className="confirm-box">
            <h3 className="confirm-title">✓ All bookings confirmed!</h3>
            <p className="confirm-sub">Booking ID: <strong>NW-{bookingId}</strong></p>
            <div className="observer-log">
              <p className="op-title mb-2">Confirmation log</p>
              <div className="nlog-item">📧 Email sent — "Booking NW-{bookingId} confirmed"</div>
              <div className="nlog-item">📱 SMS sent — "Your workspace is ready"</div>
              <div className="nlog-item">💳 Payment processed — {fmt(total)}</div>
            </div>
            <button className="btn-secondary mt-4" onClick={onBack}>Book another space →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOOKING PAGE ─────────────────────────────────────────────────────────────
function BookingPage({ space, onBack, onAddToCart, onCancelBooking, cartCount, onCartClick }) {
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState("daily");
  const [addons, setAddons] = useState([]);
  const [bookingState, setBookingState] = useState("pending");
  const [addedAnim, setAddedAnim] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("kaspi");
  const [paymentStep, setPaymentStep] = useState("select");

  const { rawBase, saving, total } = calcPrice(space, days, plan, addons);

  function toggleAddon(a) {
    setAddons(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  function handlePayment() {
    if (bookingState !== "pending") return;
    
    setPaymentStep("processing");
    
    setTimeout(() => {
      setPaymentStep("done");
      setBookingState("confirmed");
      setAddedAnim(true);
      onAddToCart({ space, days, plan, addons: [...addons], total });
      setTimeout(() => setAddedAnim(false), 1200);
    }, 1500);
  }

  function handleCancel() {
    if (bookingState === "pending") {
      setBookingState("cancelled");
      onCancelBooking({ space, days, plan, addons: [...addons], total });
    }
  }

  const stateSteps = ["pending", "confirmed", "cancelled"];

  const paymentMethods = {
    kaspi: { name: "Kaspi", icon: "💰", details: "QR code via Kaspi.kz" },
    halyk: { name: "Halyk", icon: "🏦", details: "Halyk Pay / Halyk Bank" },
    visa:  { name: "Visa",  icon: "💳", details: "Card payment (Visa/Mastercard)" },
  };

  const pricePerPerson = (space.daily_rate / space.capacity).toFixed(0);

  return (
    <div className="min-h-screen bg-surface">

      <header className="navbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="logo">NestWorks</span>
        <button className="cart-pill" onClick={onCartClick}>
          🛒 Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </header>

      <div className="booking-layout">

        <div className="booking-left">
          <div className="bp-header">
            <div>
              <h2 className="bp-title">{space.name}</h2>
              <p className="bp-type">{space.type} · Fits {space.capacity} people</p>
              <p className="text-green-600 text-sm mt-1">~{pricePerPerson} ₸ per person/day</p>
            </div>
            <div className="bp-rate-wrap">
              <span className="bp-rate">{fmt(space.daily_rate)}</span>
              <span className="bp-rate-sub">/day</span>
            </div>
          </div>

          <div className="pattern-block">
            <h3 className="pattern-title">How long?</h3>
            <div className="plan-pills">
              {[
                { key: "daily", label: "Day by day", tag: "" },
                { key: "weekly", label: "Weekly pass", tag: "save 10%" },
                { key: "monthly", label: "Monthly pass", tag: "save 20%" },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  className={`plan-pill ${plan === p.key ? "plan-pill-active" : ""}`}
                  disabled={bookingState !== "pending"}
                >
                  {p.label}
                  {p.tag && <span className="plan-discount">({p.tag})</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="pattern-block">
            <h3 className="pattern-title">For how many days?</h3>
            <div className="dur-row">
              <span className="dur-label">Days</span>
              <input
                type="range" min="1" max="90" step="1" value={days}
                onChange={e => setDays(+e.target.value)}
                className="dur-slider"
                disabled={bookingState !== "pending"}
              />
              <span className="dur-val">{days} {days === 1 ? "day" : "days"}</span>
            </div>
          </div>

          <div className="pattern-block">
            <h3 className="pattern-title">Want anything extra?</h3>
            <div className="addons-grid">
              {Object.entries(ADDON_LABELS).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => toggleAddon(key)}
                  className={`addon-card ${addons.includes(key) ? "addon-card-on" : ""}`}
                  disabled={bookingState !== "pending"}
                >
                  <span className="addon-icon">{info.icon}</span>
                  <div>
                    <div className="addon-label">{info.label}</div>
                    <div className="addon-price">{info.desc}</div>
                  </div>
                  {addons.includes(key) && <span className="addon-wrapped">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="pattern-block">
            <h3 className="pattern-title">Pay with</h3>
            <div className="payment-grid">
              {Object.entries(paymentMethods).map(([id, pm]) => (
                <button
                  key={id}
                  className={`payment-card ${selectedPayment === id ? "payment-active" : ""}`}
                  onClick={() => setSelectedPayment(id)}
                  disabled={bookingState !== "pending"}
                >
                  <span className="payment-icon">{pm.icon}</span>
                  <div>
                    <div className="payment-name">{pm.name}</div>
                    <div className="payment-details">{pm.details}</div>
                  </div>
                  {selectedPayment === id && <span className="payment-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="pattern-block">
            <h3 className="pattern-title">Booking status</h3>
            <div className="state-track">
              {stateSteps.map((s, i) => {
                const idx = stateSteps.indexOf(bookingState);
                const isPast = i < idx;
                const isCurrent = s === bookingState;
                return (
                  <div key={s} className={`state-node ${isCurrent ? "state-current" : isPast ? "state-past" : ""}`}>
                    {s === "pending" ? "📍 Pending" : s === "confirmed" ? "✓ Confirmed" : "✗ Cancelled"}
                  </div>
                );
              })}
            </div>
            
            {bookingState === "pending" && (
              <button className="cancel-btn" onClick={handleCancel}>
                ✗ Cancel booking
              </button>
            )}
            
            {bookingState === "cancelled" && (
              <div className="cancel-message">
                ✗ Booking cancelled. Saved to history.
              </div>
            )}
          </div>
        </div>

        <div className="booking-right">
          <div className="summary-card">
            <h3 className="summary-title">Your total</h3>

            <div className="summary-rows">
              <div className="summary-row">
                <span>{days} {days === 1 ? "day" : "days"} × {fmt(space.daily_rate)}</span>
                <span>{fmt(rawBase)}</span>
              </div>
              {saving > 0 && (
                <div className="summary-row summary-saving">
                  <span>{plan === "weekly" ? "Weekly" : "Monthly"} discount</span>
                  <span>– {fmt(saving)}</span>
                </div>
              )}
              {addons.map(a => (
                <div key={a} className="summary-row">
                  <span>{ADDON_LABELS[a].label}</span>
                  <span>{fmt(ADDON_PRICES[a] * days)}</span>
                </div>
              ))}
              <hr className="summary-divider" />
              <div className="summary-total">
                <span>Total</span>
                <span className="summary-total-val">{fmt(total)}</span>
              </div>
              <div className="text-xs text-gray-400 text-center mt-2">
                ≈ {fmt(total / space.capacity)} per person
              </div>
            </div>

            {bookingState === "pending" && (
              <button
                className={`pay-btn w-full mt-4 ${paymentStep === "processing" ? "pay-btn-processing" : ""}`}
                onClick={handlePayment}
                disabled={paymentStep === "processing"}
              >
                {paymentStep === "select" && `Pay ${fmt(total)} with ${paymentMethods[selectedPayment].name}`}
                {paymentStep === "processing" && "⏳ Processing payment..."}
                {paymentStep === "done" && "✓ Paid! Added to cart"}
              </button>
            )}

            {bookingState === "confirmed" && (
              <div className="confirmed-message">
                ✓ Booking confirmed! Check your email.
              </div>
            )}

            {bookingState === "cancelled" && (
              <button className="btn-primary w-full mt-4" onClick={onBack}>
                ← Browse other spaces
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [spaces, setSpaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [bookingHistory, setBookingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    axios.get(`${API}/spaces`)
      .then(r => setSpaces(r.data))
      .catch(() => {
        setSpaces([
          { id: 1, name: "The Focus", type: "Dedicated Desk", daily_rate: 8000, capacity: 1, icon: "🎯", features: ["Ergonomic chair", "Monitor", "Locking cabinet"] },
          { id: 2, name: "The Hive", type: "Open Space", daily_rate: 40000, capacity: 8, icon: "🐝", features: ["Hot desks", "Coffee bar", "Fast WiFi"] },
          { id: 3, name: "The Garden", type: "Open Space", daily_rate: 54000, capacity: 12, icon: "🌿", features: ["Plants", "Natural light", "Quiet zone"] },
          { id: 4, name: "The Studio", type: "Private Office", daily_rate: 80000, capacity: 20, icon: "🏢", features: ["Whiteboard", "TV screen", "Sofa"] },
          { id: 5, name: "The Loft", type: "Private Office", daily_rate: 105000, capacity: 30, icon: "🏰", features: ["Private balcony", "Kitchenette", "Meeting table"] },
          { id: 6, name: "The Stage", type: "Meeting Room", daily_rate: 150000, capacity: 60, icon: "🎪", features: ["Projector", "Sound system", "Video conferencing"] },
        ]);
      });
  }, []);

  function handleBook(space) {
    setSelected(space);
    setPage("booking");
  }

  function handleAddToCart(item) {
    const newBooking = {
      ...item,
      status: "confirmed",
      date: new Date().toISOString(),
    };
    setCart(prev => [...prev, item]);
    setBookingHistory(prev => [...prev, newBooking]);
  }

  function saveCancelledBooking(bookingData) {
    setBookingHistory(prev => [...prev, { ...bookingData, status: "cancelled", date: new Date().toISOString() }]);
  }

  function handleRemove(i) {
    setCart(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleConfirm() {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    setBookingId(id);
    setConfirmed(true);
    setCart([]);
  }

  function handleClearHistory() {
    setBookingHistory([]);
  }

  function goHome() {
    setPage("home");
    setConfirmed(false);
    setShowHistory(false);
  }

  if (showHistory) {
    return (
      <BookingHistory
        bookings={bookingHistory}
        onClearHistory={handleClearHistory}
        onBack={goHome}
      />
    );
  }

  if (page === "booking" && selected) {
    return (
      <BookingPage
        space={selected}
        onBack={goHome}
        onAddToCart={handleAddToCart}
        onCancelBooking={saveCancelledBooking}
        cartCount={cart.length}
        onCartClick={() => setPage("cart")}
      />
    );
  }

  if (page === "cart") {
    return (
      <CartPage
        cart={cart}
        onRemove={handleRemove}
        onBack={goHome}
        onConfirm={handleConfirm}
        confirmed={confirmed}
        bookingId={bookingId}
      />
    );
  }

  return (
    <HomePage
      spaces={spaces}
      onBook={handleBook}
      cartCount={cart.length}
      onCartClick={() => setPage("cart")}
      onHistoryClick={() => setShowHistory(true)}
    />
  );
}