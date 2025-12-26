import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

interface BookingWidgetProps {
  apiUrl: string;
  serviceId: string;
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
}

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityResponse {
  service_id: string;
  slots: TimeSlot[];
  total_slots: number;
}

const BookingWidget: React.FC<BookingWidgetProps> = ({
  apiUrl,
  serviceId,
  theme = {}
}) => {
  const [step, setStep] = useState<'info' | 'slots' | 'confirm'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Availability
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Confirmation
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const primaryColor = theme.primaryColor || '#007bff';
  const fontFamily = theme.fontFamily || 'Arial, sans-serif';

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: fontFamily,
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    heading: {
      color: '#333',
      marginBottom: '20px',
      fontSize: '24px',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '15px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box' as const,
    },
    button: {
      backgroundColor: primaryColor,
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      width: '100%',
    },
    slotButton: {
      backgroundColor: 'white',
      color: '#333',
      padding: '12px',
      border: `2px solid ${primaryColor}`,
      borderRadius: '4px',
      marginBottom: '10px',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left' as const,
    },
    selectedSlot: {
      backgroundColor: primaryColor,
      color: 'white',
    },
    error: {
      color: '#dc3545',
      padding: '12px',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '4px',
      marginBottom: '15px',
    },
    success: {
      color: '#155724',
      padding: '20px',
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      borderRadius: '4px',
      textAlign: 'center' as const,
    },
  };

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<AvailabilityResponse>(
        `${apiUrl}/api/availability`,
        {
          params: {
            service_id: serviceId,
            days_ahead: 7,
          },
        }
      );

      setSlots(response.data.slots);
      setStep('slots');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone) {
      setError('Please fill in all required fields');
      return;
    }

    fetchAvailability();
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${apiUrl}/api/bookings`, {
        customer_email: email,
        customer_name: name,
        customer_phone: phone,
        service_id: serviceId,
        start_time: selectedSlot.start,
        notes: notes || undefined,
      });

      if (response.data.success) {
        setBookingConfirmed(true);
        setStep('confirm');
      } else {
        setError(response.data.message || 'Failed to create booking');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const renderInfoStep = () => (
    <form onSubmit={handleInfoSubmit}>
      <h2 style={styles.heading}>Book Your Appointment</h2>

      {error && <div style={styles.error}>{error}</div>}

      <input
        type="text"
        placeholder="Full Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
        required
      />

      <input
        type="email"
        placeholder="Email *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
        required
      />

      <input
        type="tel"
        placeholder="Phone (e.g., +12345678901) *"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={styles.input}
        required
      />

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ ...styles.input, minHeight: '80px' }}
      />

      <button
        type="submit"
        style={styles.button}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Continue'}
      </button>
    </form>
  );

  const renderSlotsStep = () => (
    <div>
      <h2 style={styles.heading}>Select a Time</h2>

      {error && <div style={styles.error}>{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        {slots.length === 0 ? (
          <p>No available slots found. Please try a different date range.</p>
        ) : (
          slots.map((slot, index) => {
            const isSelected = selectedSlot?.start === slot.start;
            const slotDate = parseISO(slot.start);

            return (
              <button
                key={index}
                onClick={() => handleSlotSelect(slot)}
                style={{
                  ...styles.slotButton,
                  ...(isSelected ? styles.selectedSlot : {}),
                }}
              >
                {format(slotDate, 'EEEE, MMMM d, yyyy')} at {format(slotDate, 'h:mm a')}
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={handleBooking}
        style={styles.button}
        disabled={!selectedSlot || loading}
      >
        {loading ? 'Booking...' : 'Confirm Booking'}
      </button>
    </div>
  );

  const renderConfirmStep = () => (
    <div style={styles.success}>
      <h2 style={{ ...styles.heading, color: '#155724' }}>Booking Confirmed!</h2>
      <p>
        Your appointment has been successfully booked for{' '}
        {selectedSlot && format(parseISO(selectedSlot.start), 'EEEE, MMMM d, yyyy at h:mm a')}
      </p>
      <p>
        We've sent a confirmation email to {email} and an SMS to {phone}.
      </p>
      <p style={{ marginTop: '20px' }}>
        You'll receive reminder notifications 24 hours and 2 hours before your appointment.
      </p>
    </div>
  );

  return (
    <div style={styles.container}>
      {step === 'info' && renderInfoStep()}
      {step === 'slots' && renderSlotsStep()}
      {step === 'confirm' && renderConfirmStep()}
    </div>
  );
};

export default BookingWidget;
