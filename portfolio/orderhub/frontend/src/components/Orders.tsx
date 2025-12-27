import React from 'react';
import './Pages.css';

const Orders: React.FC = () => {
  const orders = [
    { id: 'ORD-2847', platform: 'shopify', customer: 'Sarah Johnson', date: '2024-01-15', items: 3, total: 249.99, status: 'pending' },
    { id: 'AMZ-9182', platform: 'amazon', customer: 'Mike Chen', date: '2024-01-15', items: 1, total: 89.00, status: 'processing' },
    { id: 'EBY-4521', platform: 'ebay', customer: 'Emily Davis', date: '2024-01-14', items: 2, total: 175.50, status: 'shipped' },
    { id: 'ETS-7834', platform: 'etsy', customer: 'Alex Thompson', date: '2024-01-14', items: 1, total: 45.00, status: 'pending' },
    { id: 'ORD-2846', platform: 'shopify', customer: 'Jennifer Lee', date: '2024-01-14', items: 4, total: 320.00, status: 'delivered' },
    { id: 'AMZ-9181', platform: 'amazon', customer: 'David Brown', date: '2024-01-13', items: 2, total: 156.75, status: 'shipped' },
    { id: 'EBY-4520', platform: 'ebay', customer: 'Lisa Wilson', date: '2024-01-13', items: 1, total: 89.99, status: 'delivered' },
    { id: 'ETS-7833', platform: 'etsy', customer: 'Mark Taylor', date: '2024-01-12', items: 3, total: 125.50, status: 'pending' },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Manage orders from all platforms</p>
        </div>
        <div className="header-actions">
          <select className="filter-select">
            <option>All Platforms</option>
            <option>Shopify</option>
            <option>Amazon</option>
            <option>eBay</option>
            <option>Etsy</option>
          </select>
          <select className="filter-select">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
          </select>
        </div>
      </header>

      <div className="content-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Platform</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="font-semibold">#{order.id}</td>
                <td><span className={`badge badge-${order.platform}`}>{order.platform}</span></td>
                <td>{order.customer}</td>
                <td className="text-muted">{order.date}</td>
                <td>{order.items} items</td>
                <td className="font-semibold">${order.total.toFixed(2)}</td>
                <td><span className={`status status-${order.status}`}>{order.status}</span></td>
                <td><button className="action-btn">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
