import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function App() {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [booking, setBooking] = useState({ days: 7, plan: 'daily', addons: [] });
  const [price, setPrice] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/spaces`)
      .then(res => setSpaces(res.data))
      .catch(err => console.error('Error:', err));
  }, []);

  useEffect(() => {
    if (selectedSpace) calculatePrice();
  }, [booking, selectedSpace]);

  const calculatePrice = async () => {
    try {
      const res = await axios.post(`${API_URL}/calculate`, {
        space_id: selectedSpace.id,
        days: booking.days,
        plan: booking.plan,
        addons: booking.addons
      });
      setPrice(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/book`, {
        space_id: selectedSpace.id,
        days: booking.days,
        plan: booking.plan,
        addons: booking.addons
      });
      setBookingResult(res.data);
      setTimeout(() => {
        setBookingResult(null);
        setSelectedSpace(null);
        setBooking({ days: 7, plan: 'daily', addons: [] });
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addon) => {
    setBooking(prev => ({
      ...prev,
      addons: prev.addons.includes(addon) 
        ? prev.addons.filter(a => a !== addon) 
        : [...prev.addons, addon]
    }));
  };

  if (!selectedSpace) {
    return (
      <div style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '16px 24px'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>✨</span>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #6367FF, #8494FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NestWorks</h1>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>🎯 10 Design Patterns | ✨ Premium Coworking</div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', background: 'linear-gradient(135deg, #6367FF, #8494FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
            Find Your Perfect Space
          </h2>
          <p style={{ color: '#666', fontSize: '18px' }}>Choose from our curated collection of premium workspaces</p>
        </div>

        {/* Spaces Grid */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {spaces.map(space => (
              <div 
                key={space.id} 
                onClick={() => setSelectedSpace(space)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '28px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                }}
              >
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>{space.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>{space.name}</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>{space.type}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#6367FF' }}>${space.daily_rate}</span>
                  <span style={{ color: '#999' }}>/day</span>
                </div>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>👥 Up to {space.capacity} people</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {space.features?.slice(0, 2).map((f, i) => (
                    <span key={i} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '20px' }}>{f}</span>
                  ))}
                </div>
                <button style={{
                  background: 'linear-gradient(135deg, #6367FF, #8494FF)',
                  color: 'white',
                  fontWeight: '600',
                  padding: '10px 20px',
                  borderRadius: '40px',
                  border: 'none',
                  width: '100%',
                  marginTop: '16px',
                  cursor: 'pointer'
                }}>Select Space →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>✨ NestWorks — where creativity meets productivity</p>
        </div>
      </div>
    );
  }

  // Booking Form
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>✨</span>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #6367FF, #8494FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NestWorks</h1>
          </div>
          <button 
            onClick={() => setSelectedSpace(null)}
            style={{
              background: 'rgba(255,255,255,0.25)',
              padding: '8px 20px',
              borderRadius: '40px',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer'
            }}
          >
            ← Browse Spaces
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left Column */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.25)',
            padding: '32px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>{selectedSpace.icon}</div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>{selectedSpace.name}</h2>
              <p style={{ color: '#666' }}>{selectedSpace.type}</p>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                📅 Duration: {booking.days} days
              </label>
              <input
                type="range"
                min="1"
                max="90"
                value={booking.days}
                onChange={(e) => setBooking({ ...booking, days: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Pricing Plan */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                💰 Pricing Plan <span style={{ fontSize: '10px', color: '#6367FF' }}>(Strategy Pattern)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {['daily', 'weekly', 'monthly'].map(plan => (
                  <button
                    key={plan}
                    onClick={() => setBooking({ ...booking, plan })}
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      background: booking.plan === plan ? '#6367FF' : 'rgba(255,255,255,0.3)',
                      color: booking.plan === plan ? 'white' : '#333',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {plan === 'daily' ? 'Daily' : plan === 'weekly' ? 'Weekly (-10%)' : 'Monthly (-20%)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                🎁 Add-ons <span style={{ fontSize: '10px', color: '#6367FF' }}>(Decorator Pattern)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'parking', name: '🅿️ Parking Spot', price: '+$15/day' },
                  { id: 'coffee', name: '☕ Premium Coffee', price: '+$8/day' },
                  { id: 'monitor', name: '🖥️ Extra Monitor', price: '+$12/day' }
                ].map(addon => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: booking.addons.includes(addon.id) ? '#6367FF' : 'rgba(255,255,255,0.3)',
                      color: booking.addons.includes(addon.id) ? 'white' : '#333',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{addon.name}</span>
                    <span>{addon.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.25)',
            padding: '32px'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', background: 'linear-gradient(135deg, #6367FF, #8494FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Booking Summary
            </h3>
            
            {price && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <span>Daily rate</span>
                  <span>${selectedSpace.daily_rate}/day</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <span>Base price ({booking.days} days)</span>
                  <span>${price.base_price?.toFixed(2)}</span>
                </div>
                {price.savings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'green' }}>
                    <span>✨ {booking.plan} plan discount</span>
                    <span>-${price.savings?.toFixed(2)}</span>
                  </div>
                )}
                {price.addons_total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <span>Add-ons total</span>
                    <span>+${price.addons_total?.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: '20px', fontWeight: 'bold' }}>
                  <span>Total</span>
                  <span style={{ color: '#6367FF' }}>${price.total_price?.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #6367FF, #8494FF)',
                color: 'white',
                fontWeight: '600',
                padding: '14px',
                borderRadius: '40px',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Processing...' : '✨ Confirm Booking'}
            </button>

            {bookingResult && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(144,238,144,0.3)', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', color: 'green' }}>✅ Booking Confirmed!</p>
                <p style={{ fontSize: '12px' }}>ID: {bookingResult.booking_id}</p>
              </div>
            )}

            <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '10px', textAlign: 'center', color: '#999' }}>
              🎯 Strategy → Pricing | 🎨 Decorator → Add-ons | 👀 Observer → Notifications<br/>
              📋 Command → Bookings | 🏛️ Facade → Simple API | 🔄 Iterator → Browse
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;