import React, { useEffect, useState } from 'react';
import './Dashboard.css';

interface Order {
  id: string;
  platform: string;
  customer: string;
  items: number;
  total: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo data - in production would fetch from API
    const demoOrders: Order[] = [
      { id: 'ORD-2847', platform: 'shopify', customer: 'Sarah Johnson', items: 3, total: 249.99, status: 'pending' },
      { id: 'AMZ-9182', platform: 'amazon', customer: 'Mike Chen', items: 1, total: 89.00, status: 'processing' },
      { id: 'EBY-4521', platform: 'ebay', customer: 'Emily Davis', items: 2, total: 175.50, status: 'shipped' },
      { id: 'ETS-7834', platform: 'etsy', customer: 'Alex Thompson', items: 1, total: 45.00, status: 'pending' },
    ];
    setOrders(demoOrders);
    setLoading(false);
  }, []);

  const platformStats = [
    { name: 'Shopify', orders: 47, today: 12, icon: '🛒', color: '#95BF47' },
    { name: 'Amazon', orders: 124, today: 28, icon: '📦', color: '#FF9900' },
    { name: 'eBay', orders: 89, today: 19, icon: '🔍', color: '#0064D2' },
    { name: 'Etsy', orders: 31, today: 5, icon: '🎁', color: '#F56400' },
  ];

  const getPlatformBadgeClass = (platform: string) => {
    return `platform-badge platform-${platform}`;
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-${status}`;
  };

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Unified view of all your e-commerce platforms</p>
        </div>
        <div className="header-actions">
          <span className="sync-info">Last sync: 2 min ago</span>
          <button className="sync-btn">🔄 Sync Now</button>
        </div>
      </header>

      <div className="platform-cards">
        {platformStats.map((platform) => (
          <div key={platform.name} className="platform-card">
            <div className="platform-header">
              <div className="platform-icon" style={{ backgroundColor: `${platform.color}20`, color: platform.color }}>
                {platform.icon}
              </div>
              <span className="connected-badge">Connected</span>
            </div>
            <div className="platform-name">{platform.name}</div>
            <div className="platform-orders">{platform.orders} orders</div>
            <div className="platform-today">+{platform.today} today</div>
          </div>
        ))}
      </div>

      <div className="summary-cards">
        <div className="summary-card revenue-card">
          <div className="summary-label">Total Revenue (Today)</div>
          <div className="summary-value">$12,847</div>
          <div className="summary-sub">+23% from yesterday</div>
        </div>
        <div className="summary-card pending-card">
          <div className="summary-label">Orders Pending</div>
          <div className="summary-value">64</div>
          <div className="summary-sub">Needs fulfillment</div>
        </div>
        <div className="summary-card alerts-card">
          <div className="summary-label">Low Stock Alerts</div>
          <div className="summary-value">7</div>
          <div className="summary-sub">Items need restock</div>
        </div>
      </div>

      <div className="orders-section">
        <div className="orders-header">
          <h2>Recent Orders</h2>
          <a href="#" className="view-all">View All</a>
        </div>
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Platform</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">#{order.id}</td>
                  <td><span className={getPlatformBadgeClass(order.platform)}>{order.platform}</span></td>
                  <td className="customer">{order.customer}</td>
                  <td className="items">{order.items} item{order.items > 1 ? 's' : ''}</td>
                  <td className="total">${order.total.toFixed(2)}</td>
                  <td><span className={getStatusBadgeClass(order.status)}>{order.status}</span></td>
                  <td>
                    <a href="#" className={`action-link ${order.status === 'shipped' ? 'disabled' : ''}`}>
                      {order.status === 'shipped' ? 'Fulfilled' : 'Fulfill'}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
