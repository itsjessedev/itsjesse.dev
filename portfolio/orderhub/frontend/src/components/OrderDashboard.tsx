import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './OrderDashboard.css';

interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  platform: string;
  order_number: string | null;
  status: string;
  order_date: string;
  customer_name: string;
  customer_email: string | null;
  total: number;
  currency: string;
  tracking_number: string | null;
  items: OrderItem[];
}

interface PlatformStats {
  platforms: Array<{
    name: string;
    type: string;
    connected: boolean;
    orders_count: number;
  }>;
  total_orders: number;
}

const OrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [platforms, setPlatforms] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchPlatforms();
    fetchOrders();
  }, [selectedPlatform, selectedStatus]);

  const fetchPlatforms = async () => {
    try {
      const response = await axios.get('/api/platforms');
      setPlatforms(response.data);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/api/orders?limit=100';
      if (selectedPlatform !== 'all') {
        url += `&platform=${selectedPlatform}`;
      }
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }

      const response = await axios.get(url);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncOrders = async () => {
    try {
      await axios.post('/api/orders/sync');
      fetchOrders();
      fetchPlatforms();
    } catch (error) {
      console.error('Error syncing orders:', error);
    }
  };

  const getPlatformColor = (platform: string): string => {
    const colors: { [key: string]: string } = {
      shopify: '#95BF47',
      amazon: '#FF9900',
      ebay: '#E53238',
      etsy: '#F56400',
    };
    return colors[platform] || '#666';
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      pending: '#FFA500',
      processing: '#2196F3',
      shipped: '#9C27B0',
      delivered: '#4CAF50',
      cancelled: '#F44336',
      refunded: '#FF5722',
    };
    return colors[status] || '#666';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="dashboard">
      {/* Platform Stats */}
      {platforms && (
        <div className="platform-stats">
          <div className="stats-header">
            <h2>Platform Overview</h2>
            <button onClick={syncOrders} className="sync-button">
              Sync Orders
            </button>
          </div>
          <div className="stats-grid">
            {platforms.platforms.map((platform) => (
              <div key={platform.type} className="stat-card">
                <div
                  className="platform-indicator"
                  style={{ backgroundColor: getPlatformColor(platform.type) }}
                />
                <div className="stat-content">
                  <h3>{platform.name}</h3>
                  <div className="stat-value">{platform.orders_count}</div>
                  <div className="stat-label">orders</div>
                  <div className={`status ${platform.connected ? 'connected' : 'disconnected'}`}>
                    {platform.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Platform:</label>
          <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
            <option value="all">All Platforms</option>
            <option value="shopify">Shopify</option>
            <option value="amazon">Amazon</option>
            <option value="ebay">eBay</option>
            <option value="etsy">Etsy</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-section">
        <h2>Orders ({orders.length})</h2>
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Tracking</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span
                        className="platform-badge"
                        style={{ backgroundColor: getPlatformColor(order.platform) }}
                      >
                        {order.platform}
                      </span>
                    </td>
                    <td className="order-number">
                      {order.order_number || order.id}
                    </td>
                    <td className="date">{formatDate(order.order_date)}</td>
                    <td>
                      <div className="customer">
                        <div className="customer-name">{order.customer_name}</div>
                        {order.customer_email && (
                          <div className="customer-email">{order.customer_email}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="items-preview">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="item-preview">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="total">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="tracking">
                      {order.tracking_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;
