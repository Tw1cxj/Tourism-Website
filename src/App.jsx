import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import AuthPages from "./AuthPages";
import LandingPage from "./LandingPage";
import SearchPage from "./SearchPage";
import ReviewPage from "./ReviewPage";
import EnquiryPage from "./EnquiryPage"; 
import TransportPage from "./TransportPage";
import RestaurantPage from "./RestaurantPage";
import BookingPage from "./BookingPage";
import ItineraryPage from "./ItineraryPage";
import { useBookings } from "./Bookings";
import AdminDashboard from "./AdminDashboard";
import VendorDashboard from "./VendorDashboard";
import TravelInformation from "./TravelInformation";
import { createUser, ROLES } from "./domain";
import useTourismStore from "./useTourismStore";
import { publishedCatalog } from "./tourismStore";

// Only logged-in users with an allowed role can open the page
function Guard({ user, allow, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={user.homePath()} replace />;
  return children;
}

// What the booking page needs to know about the chosen item
function toDraft(kind, item) {
  const place = String(item.location);
  if (kind === "accommodation") return { itemId: item.id, name: item.name, place, unitPrice: item.pricePerNight, unit: "night", max: item.maxGuests };
  if (kind === "transport") return { itemId: item.id, name: item.name, place, unitPrice: item.price, unit: item.priceUnit, max: item.capacity };
  return { itemId: item.id, name: item.name, place, priceLabel: item.priceLabel, max: 12 };
}

const REVIEW_BACK = { accommodation: "/accommodation", transport: "/transportation", restaurant: "/restaurant" };

function ReviewRoute({ tourism, repository, user, onBack, onLogout }) {
  const { state } = useLocation();
  const kind = state?.kind;
  if (!REVIEW_BACK[kind]) return <Navigate to="/home" replace />;
  const item = publishedCatalog(tourism, kind).find((x) => x.id === state.id);
  if (!item) return <Navigate to={REVIEW_BACK[kind]} replace />;
  // Only reviews an admin has published are shown to visitors
  const published = (tourism.reviews ?? []).filter((r) => r.category === kind && r.listingId === item.id && r.status === "published");
  // A new review is saved as "pending" so it appears in the admin Reviews tab for moderation
  const submitReview = ({ rating, comment }) =>
    repository.update(user, `Submitted ${kind} review for listing ${item.id}`, (next) => {
      next.reviews = next.reviews ?? [];
      next.reviews.push({
        id: Math.max(0, ...next.reviews.map((r) => Number(r.id) || 0)) + 1,
        category: kind, listingId: item.id,
        authorId: user.id, authorName: user.name,
        rating, comment, status: "pending", createdAt: new Date().toISOString(),
      });
    });
  return <ReviewPage kind={kind} item={item} reviews={published} onSubmit={submitReview} user={user} onBack={() => onBack(REVIEW_BACK[kind])} onLogout={onLogout} />;
}

export default function App() {
  const navigate = useNavigate();
  const [tourism, repository] = useTourismStore();

  // Keep the user logged in when the page is refreshed
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("user");
      return saved ? createUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  const { bookings, addBooking, cancelBooking, savedEvents, toggleEvent } = useBookings(user);

  const handleLogin = (data) => {
    const account = data.user.role === ROLES.USER ? repository.resolveDemoTourist(data.user) : data.user;
    const u = createUser(account);
    sessionStorage.setItem("user", JSON.stringify(account));
    setUser(u);
    navigate(u.homePath(), { replace: true }); // admin -> /admin, vendor -> /vendor, tourist -> /home
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const people = [ROLES.USER, ROLES.VENDOR]; // roles that use the normal site
  const home = () => navigate("/home");
  // Book button -> opens the booking page for that item
  // Review button -> opens the review page for that item
  const review = (kind) => (item) => navigate("/review", { state: { kind, id: item.id } });
  const book = (kind) => (item) => { repository.recordActivity(user, "listing_view", { category: kind, listingId: item.id }); navigate("/booking", { state: { kind, draft: toDraft(kind, item) } }); };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.homePath()} replace /> : <AuthPages onLoggedIn={handleLogin} />} />

<Route
  path="/home"
  element={
    <Guard user={user} allow={people}>
      <LandingPage
        user={user}
        onLogout={handleLogout}
        bookings={bookings}
        onItinerary={() => navigate("/itinerary")}
        savedEvents={savedEvents}
        onToggleEvent={toggleEvent}
      />
    </Guard>
  }
/>

<Route
  path="/accommodation"
  element={
    <Guard user={user} allow={people}>
      <SearchPage
        accommodations={publishedCatalog(tourism, "accommodation")}
        user={user}
        onLogout={handleLogout}
        onBack={home}
        onBook={book("accommodation")}
        onReview={review("accommodation")}
      />
    </Guard>
  }
/>

<Route
  path="/transportation"
  element={
    <Guard user={user} allow={people}>
      <TransportPage
        items={publishedCatalog(tourism, "transport")}
        user={user}
        onLogout={handleLogout}
        onBack={home}
        onBook={book("transport")}
        onReview={review("transport")}
      />
    </Guard>
  }
/>

<Route
  path="/restaurant"
  element={
    <Guard user={user} allow={people}>
      <RestaurantPage
        items={publishedCatalog(tourism, "restaurant")}
        user={user}
        onLogout={handleLogout}
        onBack={home}
        onBook={book("restaurant")}
        onReview={review("restaurant")}
      />
    </Guard>
  }
/>

<Route
  path="/travel-information"
  element={
    <Guard user={user} allow={people}>
      <TravelInformation
        user={user}
        onLogout={handleLogout}
        onBack={home}
      />
    </Guard>
  }
/>

<Route
  path="/review"
  element={
    <Guard user={user} allow={people}>
      <ReviewRoute tourism={tourism} repository={repository} user={user} onBack={(path) => navigate(path)} onLogout={handleLogout} />
    </Guard>
  }
/>

<Route 
  path="/enquiry" 
  element={
    <Guard user={user} allow={people}>
      <EnquiryPage user={user} onLogout={handleLogout} onBack={home} />
    </Guard>
  } 
/>

      <Route path="/booking" element={<Guard user={user} allow={people}><BookingPage user={user} onLogout={handleLogout} onConfirm={addBooking} savedEvents={savedEvents} onToggleEvent={toggleEvent} /></Guard>} />

      <Route path="/itinerary" element={<Guard user={user} allow={people}><ItineraryPage user={user} bookings={bookings} onCancel={cancelBooking} onBack={home} onBrowse={home} onLogout={handleLogout} savedEvents={savedEvents} onToggleEvent={toggleEvent} /></Guard>} />

      <Route path="/vendor" element={<Guard user={user} allow={[ROLES.VENDOR]}><VendorDashboard user={user} onLogout={handleLogout} /></Guard>} />

      <Route path="/admin" element={<Guard user={user} allow={[ROLES.ADMIN]}><AdminDashboard user={user} onLogout={handleLogout} /></Guard>} />

      <Route path="*" element={<Navigate to={user ? user.homePath() : "/login"} replace />} />
    </Routes>
  );
}