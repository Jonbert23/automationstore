import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../../services/sanityClient';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Fetch all users with their order stats
      const users = await client.fetch(`
        *[_type == "user"]{
          _id,
          _createdAt,
          name,
          email,
          picture,
          authType,
          addresses
        }
      `);

      // Fetch orders to calculate stats per customer
      const orders = await client.fetch(`
        *[_type == "order"]{
          user,
          total,
          _createdAt
        }
      `);

      // Calculate stats for each customer
      const customersWithStats = users.map(user => {
        const userOrders = orders.filter(order => order.user === user.email);
        const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const lastOrder = userOrders.length > 0 
          ? userOrders.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt))[0]._createdAt
          : null;

        return {
          ...user,
          ordersCount: userOrders.length,
          totalSpent,
          lastOrder,
          location: user.addresses?.[0] 
            ? `${user.addresses[0].city || ''}, ${user.addresses[0].country || ''}`.replace(/^, |, $/g, '')
            : 'Not provided'
        };
      });

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      const search = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.location?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b._createdAt) - new Date(a._createdAt);
        case 'oldest':
          return new Date(a._createdAt) - new Date(b._createdAt);
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'orders':
          return b.ordersCount - a.ordersCount;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Location', 'Orders', 'Total Spent', 'Last Order', 'Joined'];
    const rows = filteredCustomers.map(c => [
      c.name || 'N/A',
      c.email,
      c.location,
      c.ordersCount,
      `$${c.totalSpent.toFixed(2)}`,
      formatDate(c.lastOrder),
      formatDate(c._createdAt)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading customers...
      </div>
    );
  }

  return (
    <>
      <div className="admin-top-bar">
        <h1 className="admin-page-title">Customers</h1>
        <button onClick={exportToCSV} className="admin-action-btn secondary">
          <i className="fas fa-download"></i> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '30px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Customers</span>
            <i className="fas fa-users"></i>
          </div>
          <div className="admin-stat-value">{customers.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>With Orders</span>
            <i className="fas fa-shopping-bag"></i>
          </div>
          <div className="admin-stat-value">
            {customers.filter(c => c.ordersCount > 0).length}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Total Revenue</span>
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="admin-stat-value">
            ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Avg. per Customer</span>
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="admin-stat-value">
            ${customers.length > 0 
              ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2)
              : '0.00'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          className="admin-form-input"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <select
          className="admin-form-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ maxWidth: '180px' }}
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="spent">Sort: Total Spent</option>
          <option value="orders">Sort: Order Count</option>
          <option value="name">Sort: Name A-Z</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="admin-data-card">
        {filteredCustomers.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-users"></i>
            <p>{searchTerm ? 'No customers found' : 'No customers yet'}</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {customer.picture ? (
                        <img 
                          src={customer.picture} 
                          alt={customer.name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}>
                          {getInitials(customer.name)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{customer.name || 'Unnamed'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{customer.location || 'Not provided'}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 600, 
                      color: customer.ordersCount > 0 ? 'var(--primary)' : 'var(--text-muted)' 
                    }}>
                      {customer.ordersCount}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>${customer.totalSpent.toFixed(2)}</td>
                  <td>{formatDate(customer.lastOrder)}</td>
                  <td>{formatDate(customer._createdAt)}</td>
                  <td>
                    <Link
                      to={`/admin/customers/${customer._id}`}
                      className="admin-action-btn secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <i className="fas fa-eye"></i> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-pagination">
        <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
      </div>
    </>
  );
};

export default AdminCustomers;
