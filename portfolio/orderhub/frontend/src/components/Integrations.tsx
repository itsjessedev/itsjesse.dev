import React from 'react';
import './Pages.css';

const Integrations: React.FC = () => {
  const integrations = [
    { name: 'Shopify', description: 'Sync orders and inventory from your Shopify store', connected: true, lastSync: '2 min ago', icon: '🛒', color: '#95BF47' },
    { name: 'Amazon', description: 'Import orders from Amazon Seller Central', connected: true, lastSync: '5 min ago', icon: '📦', color: '#FF9900' },
    { name: 'eBay', description: 'Connect your eBay seller account', connected: true, lastSync: '3 min ago', icon: '🔍', color: '#0064D2' },
    { name: 'Etsy', description: 'Sync with your Etsy shop', connected: true, lastSync: '8 min ago', icon: '🎁', color: '#F56400' },
    { name: 'WooCommerce', description: 'Connect WordPress WooCommerce stores', connected: false, lastSync: null, icon: '🛍️', color: '#96588a' },
    { name: 'BigCommerce', description: 'Integrate with BigCommerce platform', connected: false, lastSync: null, icon: '🏪', color: '#34313f' },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Integrations</h1>
          <p>Connect and manage your e-commerce platforms</p>
        </div>
      </header>

      <div className="integrations-grid">
        {integrations.map((integration) => (
          <div key={integration.name} className={`integration-card ${integration.connected ? 'connected' : ''}`}>
            <div className="integration-header">
              <div className="integration-icon" style={{ backgroundColor: `${integration.color}20`, color: integration.color }}>
                {integration.icon}
              </div>
              <span className={`connection-status ${integration.connected ? 'connected' : 'disconnected'}`}>
                {integration.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <h3>{integration.name}</h3>
            <p>{integration.description}</p>
            {integration.connected ? (
              <div className="integration-footer">
                <span className="last-sync">Last sync: {integration.lastSync}</span>
                <button className="disconnect-btn">Disconnect</button>
              </div>
            ) : (
              <button className="connect-btn">Connect</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
