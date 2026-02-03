import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, client } from '../../services/sanityClient';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    lowStock: 0,
    pendingOrders: 0,
    pendingReviews: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Chart data state
  const [chartDateRange, setChartDateRange] = useState('7');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch products
        const products = await getProducts();
        const lowStockItems = products.filter((p) => (p.stock || 0) < 10);

        // Fetch orders
        const orders = await client.fetch(`*[_type == "order"] | order(_createdAt desc)[0...5]{
          _id,
          _createdAt,
          user,
          total,
          status
        }`);

        // Fetch all order stats
        const allOrders = await client.fetch(`*[_type == "order"]{ total, status }`);
        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const pendingOrders = allOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;

        // Fetch customers
        const customers = await client.fetch(`*[_type == "user"]{ _id }`);

        // Fetch pending reviews
        const pendingReviews = await client.fetch(`count(*[_type == "review" && isApproved != true])`);

        setStats({
          totalProducts: products.length,
          totalOrders: allOrders.length,
          totalRevenue,
          totalCustomers: customers.length,
          lowStock: lowStockItems.length,
          pendingOrders,
          pendingReviews: pendingReviews || 0,
        });

        setRecentOrders(orders);
        setLowStockProducts(lowStockItems.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch chart data when date range changes
  useEffect(() => {
    const fetchChartData = async () => {
      setChartLoading(true);
      try {
        const allOrders = await client.fetch(`*[_type == "order"]{ _createdAt, total }`);
        
        const days = parseInt(chartDateRange);
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayOrders = allOrders.filter(order => order._createdAt?.startsWith(dateStr));
          const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
          
          data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: dateStr,
            revenue: dayRevenue,
            orders: dayOrders.length
          });
        }
        
        setChartData(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [chartDateRange]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'admin-status-active';
      case 'pending':
      case 'processing':
        return 'admin-status-pending';
      case 'cancelled':
      case 'failed':
        return 'admin-status-out-of-stock';
      default:
        return 'admin-status-pending';
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading dashboard...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/" target="_blank" className="admin-action-btn">
            <i className="fas fa-external-link-alt"></i> View Store
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Revenue</span>
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="admin-stat-value">${stats.totalRevenue.toFixed(2)}</div>
          <Link to="/admin/analytics" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
            View analytics →
          </Link>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Orders</span>
            <i className="fas fa-shopping-bag"></i>
          </div>
          <div className="admin-stat-value">{stats.totalOrders}</div>
          <Link to="/admin/orders" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
            View all orders →
          </Link>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Customers</span>
            <i className="fas fa-users"></i>
          </div>
          <div className="admin-stat-value">{stats.totalCustomers}</div>
          <Link to="/admin/customers" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
            View customers →
          </Link>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Products</span>
            <i className="fas fa-box"></i>
          </div>
          <div className="admin-stat-value">{stats.totalProducts}</div>
          <Link to="/admin/products" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
            View products →
          </Link>
        </div>
      </div>

      {/* Revenue & Orders Chart */}
      <div className="admin-data-card" style={{ padding: '30px', marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h3 className="admin-card-title" style={{ margin: 0 }}>
            Revenue Overview
          </h3>
          <select
            value={chartDateRange}
            onChange={(e) => setChartDateRange(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'white',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {chartLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
            <p>Loading chart...</p>
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            <div style={{ position: 'relative' }}>
              {/* Y-axis labels */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 30, width: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>${Math.max(...chartData.map(d => d.revenue), 100).toFixed(0)}</span>
                <span>${(Math.max(...chartData.map(d => d.revenue), 100) / 2).toFixed(0)}</span>
                <span>$0</span>
              </div>
              
              {/* Chart area */}
              <div style={{ marginLeft: '70px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  gap: chartData.length > 14 ? '2px' : '6px', 
                  height: '200px',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '10px'
                }}>
                  {chartData.map((day, index) => {
                    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
                    const heightPercent = (day.revenue / maxRevenue) * 100;
                    
                    return (
                      <div 
                        key={index} 
                        style={{ 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        title={`${day.date}: $${day.revenue.toFixed(2)} (${day.orders} orders)`}
                      >
                        {/* Revenue bar */}
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '40px',
                            height: `${Math.max(heightPercent, 2)}%`,
                            background: day.revenue > 0 
                              ? 'linear-gradient(to top, #3b82f6, #60a5fa)' 
                              : '#e5e7eb',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                            position: 'relative'
                          }}
                        >
                          {/* Tooltip on hover */}
                          {day.revenue > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'var(--primary)',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              whiteSpace: 'nowrap',
                              opacity: 0,
                              transition: 'opacity 0.2s'
                            }} className="chart-tooltip">
                              ${day.revenue.toFixed(0)}
                            </div>
                          )}
                        </div>
                        
                        {/* Orders indicator */}
                        {day.orders > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: `${100 - heightPercent - 5}%`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '8px',
                            height: '8px',
                            background: '#22c55e',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }} title={`${day.orders} orders`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* X-axis labels */}
                <div style={{ 
                  display: 'flex', 
                  gap: chartData.length > 14 ? '2px' : '6px',
                  marginTop: '8px'
                }}>
                  {chartData.map((day, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        fontSize: '0.7rem', 
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      {chartData.length <= 14 || index % Math.ceil(chartData.length / 10) === 0 
                        ? day.date 
                        : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '3px' }}></div>
                <span>Revenue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%' }}></div>
                <span>Orders</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Orders */}
      <div className="admin-data-card" style={{ marginTop: '30px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Orders</h3>
          <Link to="/admin/orders" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-inbox"></i>
            <p>No orders yet</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-8).toUpperCase()}</td>
                  <td>{order.user || 'Guest'}</td>
                  <td>{formatDate(order._createdAt)}</td>
                  <td>
                    <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td>${(order.total || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Alerts Section */}
        <div className="admin-data-card" style={{ padding: '30px' }}>
          <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>
            Alerts & Actions
          </h3>
          
          {stats.pendingOrders > 0 && (
            <Link to="/admin/orders" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '15px',
              background: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '10px',
              textDecoration: 'none',
              color: 'inherit'
            }}>
              <i className="fas fa-clock" style={{ color: '#f59e0b', fontSize: '1.2rem' }}></i>
              <div style={{ flex: 1 }}>
                <strong>{stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? 's' : ''}</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>Require attention</p>
              </div>
              <i className="fas fa-chevron-right" style={{ color: '#92400e' }}></i>
            </Link>
          )}

          {stats.pendingReviews > 0 && (
            <Link to="/admin/reviews" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '15px',
              background: '#dbeafe',
              borderRadius: '8px',
              marginBottom: '10px',
              textDecoration: 'none',
              color: 'inherit'
            }}>
              <i className="fas fa-star" style={{ color: '#3b82f6', fontSize: '1.2rem' }}></i>
              <div style={{ flex: 1 }}>
                <strong>{stats.pendingReviews} review{stats.pendingReviews !== 1 ? 's' : ''} pending</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af' }}>Awaiting approval</p>
              </div>
              <i className="fas fa-chevron-right" style={{ color: '#1e40af' }}></i>
            </Link>
          )}

          {stats.lowStock > 0 && (
            <Link to="/admin/products" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '15px',
              background: '#fee2e2',
              borderRadius: '8px',
              marginBottom: '10px',
              textDecoration: 'none',
              color: 'inherit'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', fontSize: '1.2rem' }}></i>
              <div style={{ flex: 1 }}>
                <strong>{stats.lowStock} product{stats.lowStock !== 1 ? 's' : ''} low on stock</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>Less than 10 items</p>
              </div>
              <i className="fas fa-chevron-right" style={{ color: '#991b1b' }}></i>
            </Link>
          )}

          {stats.pendingOrders === 0 && stats.pendingReviews === 0 && stats.lowStock === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: '#22c55e', marginBottom: '10px' }}></i>
              <p>All caught up! No alerts.</p>
            </div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="admin-data-card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>
              Low Stock Items
            </h3>
            <Link to="/admin/products" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
              View All
            </Link>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <i className="fas fa-box" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
              <p>All products are well stocked!</p>
            </div>
          ) : (
            <div>
              {lowStockProducts.map((product) => (
                <Link 
                  key={product._id} 
                  to={`/admin/products/${product._id}`}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{product.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{product.category}</div>
                  </div>
                  <span style={{ 
                    padding: '4px 10px', 
                    background: (product.stock || 0) === 0 ? '#fee2e2' : '#fef3c7',
                    color: (product.stock || 0) === 0 ? '#991b1b' : '#92400e',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}>
                    {product.stock || 0} left
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </>
  );
};

export default AdminDashboard;
