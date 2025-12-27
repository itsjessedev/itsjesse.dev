import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Integrations from './components/Integrations';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

type Page = 'dashboard' | 'orders' | 'inventory' | 'integrations' | 'analytics' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'orders': return <Orders />;
      case 'inventory': return <Inventory />;
      case 'integrations': return <Integrations />;
      case 'analytics': return <Analytics />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">📦</span>
          <span className="logo-text">OrderHub</span>
        </div>
        <nav className="nav">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentPage('orders')}
          >
            <span className="nav-icon">📦</span>
            <span>Orders</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'inventory' ? 'active' : ''}`}
            onClick={() => setCurrentPage('inventory')}
          >
            <span className="nav-icon">📋</span>
            <span>Inventory</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'integrations' ? 'active' : ''}`}
            onClick={() => setCurrentPage('integrations')}
          >
            <span className="nav-icon">🔗</span>
            <span>Integrations</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('analytics')}
          >
            <span className="nav-icon">📈</span>
            <span>Analytics</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>
      </aside>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
