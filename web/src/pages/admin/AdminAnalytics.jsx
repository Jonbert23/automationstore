import { useState, useEffect } from 'react';
import { client, getProducts } from '../../services/sanityClient';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    revenueByDay: [],
    ordersByStatus: {},
    topProducts: [],
    recentActivity: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      const dateFilter = daysAgo.toISOString();

      // Fetch all orders
      const allOrders = await client.fetch(`
        *[_type == "order"]{
          _id,
          _createdAt,
          total,
          status,
          user,
          items[]{
            quantity,
            price,
            "productId": product._ref,
            "product": product->{ _id, title }
          }
        }
      `);

      // Filter orders by date range
      const filteredOrders = allOrders.filter(
        order => new Date(order._createdAt) >= daysAgo
      );

      // Calculate total revenue
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const allTimeRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      // Get unique customers
      const customers = await client.fetch(`*[_type == "user"]{ _id }`);

      // Revenue by day (last N days)
      const revenueByDay = [];
      for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRevenue = allOrders
          .filter(order => order._createdAt?.startsWith(dateStr))
          .reduce((sum, order) => sum + (order.total || 0), 0);
        
        const dayOrders = allOrders.filter(order => order._createdAt?.startsWith(dateStr)).length;
        
        revenueByDay.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          orders: dayOrders
        });
      }

      // Orders by status
      const ordersByStatus = allOrders.reduce((acc, order) => {
        const status = order.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Top selling products
      const productSales = {};
      allOrders.forEach(order => {
        order.items?.forEach(item => {
          const productId = item.productId || item.product?._id;
          const productTitle = item.product?.title || 'Unknown';
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = { title: productTitle, quantity: 0, revenue: 0 };
            }
            productSales[productId].quantity += item.quantity || 0;
            productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
          }
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Recent activity
      const recentActivity = allOrders
        .sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt))
        .slice(0, 10)
        .map(order => ({
          type: 'order',
          message: `New order #${order._id.slice(-6).toUpperCase()} - $${order.total?.toFixed(2)}`,
          time: order._createdAt,
          status: order.status
        }));

      setAnalytics({
        totalRevenue,
        allTimeRevenue,
        totalOrders: filteredOrders.length,
        allTimeOrders: allOrders.length,
        totalCustomers: customers.length,
        avgOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
        revenueByDay,
        ordersByStatus,
        topProducts,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#22c55e',
      completed: '#22c55e',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // Simple bar chart component
  const BarChart = ({ data, maxValue }) => {
    const max = maxValue || Math.max(...data.map(d => d.revenue), 1);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '150px', padding: '10px 0' }}>
        {data.map((item, index) => (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              style={{ 
                width: '100%', 
                maxWidth: '30px',
                height: `${(item.revenue / max) * 120}px`,
                minHeight: '4px',
                background: 'var(--primary)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease'
              }}
              title={`$${item.revenue.toFixed(2)}`}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '5px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
              {item.date}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading analytics...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Analytics</h1>
        <select
          className="admin-form-select"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Revenue ({dateRange}d)</span>
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="admin-stat-value">${analytics.totalRevenue.toFixed(2)}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            All time: ${analytics.allTimeRevenue?.toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Orders ({dateRange}d)</span>
            <i className="fas fa-shopping-bag"></i>
          </div>
          <div className="admin-stat-value">{analytics.totalOrders}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            All time: {analytics.allTimeOrders}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Customers</span>
            <i className="fas fa-users"></i>
          </div>
          <div className="admin-stat-value">{analytics.totalCustomers}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Avg. Order Value</span>
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="admin-stat-value">${analytics.avgOrderValue.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '30px' }}>
        {/* Revenue Chart */}
        <div className="admin-data-card" style={{ padding: '30px' }}>
          <h3 className="admin-form-section-title">Revenue Over Time</h3>
          {analytics.revenueByDay.length > 0 ? (
            <BarChart data={analytics.revenueByDay} />
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              No data for selected period
            </p>
          )}
        </div>

        {/* Orders by Status */}
        <div className="admin-data-card" style={{ padding: '30px' }}>
          <h3 className="admin-form-section-title">Orders by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
              const total = Object.values(analytics.ordersByStatus).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{status}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: getStatusColor(status),
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
        {/* Top Products */}
        <div className="admin-data-card" style={{ padding: '30px' }}>
          <h3 className="admin-form-section-title">Top Selling Products</h3>
          {analytics.topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    background: index < 3 ? 'var(--primary)' : '#e5e7eb',
                    color: index < 3 ? 'white' : 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{product.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {product.quantity} sold
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    ${product.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              No sales data yet
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="admin-data-card" style={{ padding: '30px' }}>
          <h3 className="admin-form-section-title">Recent Activity</h3>
          {analytics.recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflow: 'auto' }}>
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: getStatusColor(activity.status),
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div>
                    <div style={{ fontSize: '0.9rem' }}>{activity.message}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDate(activity.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              No recent activity
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAnalytics;
