import React from 'react';
import './Pages.css';

const Analytics: React.FC = () => {
  const topProducts = [
    { name: 'Wireless Bluetooth Headphones', sales: 127, revenue: 10152.73 },
    { name: 'USB-C Charging Cable 6ft', sales: 245, revenue: 3182.55 },
    { name: 'Laptop Stand Adjustable', sales: 89, revenue: 4449.11 },
    { name: 'Wireless Mouse Ergonomic', sales: 156, revenue: 5458.44 },
    { name: 'Phone Case Clear Protective', sales: 312, revenue: 4676.88 },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Sales performance and insights</p>
        </div>
        <div className="header-actions">
          <select className="filter-select">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
        </div>
      </header>

      <div className="analytics-stats">
        <div className="analytics-card purple">
          <div className="analytics-label">Total Revenue</div>
          <div className="analytics-value">$47,832.50</div>
          <div className="analytics-change positive">+12.5% vs last period</div>
        </div>
        <div className="analytics-card blue">
          <div className="analytics-label">Total Orders</div>
          <div className="analytics-value">1,247</div>
          <div className="analytics-change positive">+8.3% vs last period</div>
        </div>
        <div className="analytics-card green">
          <div className="analytics-label">Avg Order Value</div>
          <div className="analytics-value">$38.36</div>
          <div className="analytics-change positive">+3.8% vs last period</div>
        </div>
        <div className="analytics-card orange">
          <div className="analytics-label">Conversion Rate</div>
          <div className="analytics-value">3.2%</div>
          <div className="analytics-change negative">-0.4% vs last period</div>
        </div>
      </div>

      <div className="content-row">
        <div className="content-card flex-2">
          <h3>Revenue by Platform</h3>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div className="bar" style={{ height: '80%', background: '#95BF47' }}><span>Shopify</span></div>
              <div className="bar" style={{ height: '60%', background: '#FF9900' }}><span>Amazon</span></div>
              <div className="bar" style={{ height: '45%', background: '#0064D2' }}><span>eBay</span></div>
              <div className="bar" style={{ height: '30%', background: '#F56400' }}><span>Etsy</span></div>
            </div>
          </div>
        </div>
        <div className="content-card flex-1">
          <h3>Top Products</h3>
          <div className="top-products">
            {topProducts.map((product, index) => (
              <div key={product.name} className="product-row">
                <span className="rank">#{index + 1}</span>
                <div className="product-info">
                  <div className="product-name">{product.name}</div>
                  <div className="product-stats">{product.sales} sales | ${product.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
