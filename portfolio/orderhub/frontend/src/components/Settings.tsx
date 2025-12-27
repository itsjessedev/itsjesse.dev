import React from 'react';
import './Pages.css';

const Settings: React.FC = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure your OrderHub preferences</p>
        </div>
      </header>

      <div className="settings-grid">
        <div className="settings-section">
          <h3>General Settings</h3>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Business Name</div>
              <div className="setting-description">Your company or store name</div>
            </div>
            <input type="text" className="setting-input" defaultValue="My E-commerce Store" />
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Currency</div>
              <div className="setting-description">Default currency for prices</div>
            </div>
            <select className="setting-select">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
              <option>CAD ($)</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Timezone</div>
              <div className="setting-description">Your local timezone</div>
            </div>
            <select className="setting-select">
              <option>America/New_York (EST)</option>
              <option>America/Los_Angeles (PST)</option>
              <option>Europe/London (GMT)</option>
              <option>Asia/Tokyo (JST)</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Notifications</h3>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Email Notifications</div>
              <div className="setting-description">Receive order updates via email</div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Low Stock Alerts</div>
              <div className="setting-description">Get notified when items are running low</div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Daily Summary</div>
              <div className="setting-description">Receive a daily sales summary email</div>
            </div>
            <label className="toggle">
              <input type="checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Sync Settings</h3>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Auto-sync Interval</div>
              <div className="setting-description">How often to sync with platforms</div>
            </div>
            <select className="setting-select">
              <option>Every 5 minutes</option>
              <option>Every 15 minutes</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-name">Inventory Sync</div>
              <div className="setting-description">Sync inventory levels across platforms</div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-btn">Save Changes</button>
      </div>
    </div>
  );
};

export default Settings;
