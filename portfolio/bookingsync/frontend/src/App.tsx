import React from 'react';
import BookingWidget from './components/BookingWidget';

function App() {
  return (
    <div className="App">
      <BookingWidget
        apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:8000'}
        serviceId="service_1"
      />
    </div>
  );
}

export default App;
