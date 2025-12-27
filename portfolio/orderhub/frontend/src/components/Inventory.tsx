import React from 'react';
import './Pages.css';

const Inventory: React.FC = () => {
  const inventory = [
    { sku: 'SKU-001', name: 'Wireless Bluetooth Headphones', stock: 45, reorderPoint: 20, price: 79.99, status: 'in-stock' },
    { sku: 'SKU-002', name: 'USB-C Charging Cable 6ft', stock: 8, reorderPoint: 25, price: 12.99, status: 'low-stock' },
    { sku: 'SKU-003', name: 'Laptop Stand Adjustable', stock: 0, reorderPoint: 10, price: 49.99, status: 'out-of-stock' },
    { sku: 'SKU-004', name: 'Wireless Mouse Ergonomic', stock: 67, reorderPoint: 15, price: 34.99, status: 'in-stock' },
    { sku: 'SKU-005', name: 'Phone Case Clear Protective', stock: 5, reorderPoint: 30, price: 14.99, status: 'low-stock' },
    { sku: 'SKU-006', name: 'Screen Protector Tempered Glass', stock: 120, reorderPoint: 50, price: 9.99, status: 'in-stock' },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Track stock levels across all products</p>
        </div>
        <div className="header-actions">
          <select className="filter-select">
            <option>All Status</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
          <button className="primary-btn">+ Add Product</button>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-value">237</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-box">
          <div className="stat-value text-green">189</div>
          <div className="stat-label">In Stock</div>
        </div>
        <div className="stat-box">
          <div className="stat-value text-orange">41</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-box">
          <div className="stat-value text-red">7</div>
          <div className="stat-label">Out of Stock</div>
        </div>
      </div>

      <div className="content-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Stock</th>
              <th>Reorder Point</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.sku}>
                <td className="font-mono">{item.sku}</td>
                <td>{item.name}</td>
                <td className="font-semibold">{item.stock}</td>
                <td className="text-muted">{item.reorderPoint}</td>
                <td>${item.price.toFixed(2)}</td>
                <td><span className={`status status-${item.status}`}>{item.status.replace('-', ' ')}</span></td>
                <td><button className="action-btn">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
