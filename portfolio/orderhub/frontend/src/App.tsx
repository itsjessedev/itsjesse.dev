import React from 'react';
import './App.css';
import OrderDashboard from './components/OrderDashboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>OrderHub</h1>
        <p>Multi-Platform E-commerce Aggregator</p>
      </header>
      <main>
        <OrderDashboard />
      </main>
    </div>
  );
}

export default App;
