import { Outlet, Link, useNavigate } from 'react-router-dom';

const AppLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '240px', background: '#1e293b', color: '#fff', padding: '1rem' }}>
        <h2>Zentrio CRM</h2>
        <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/contacts" style={{ color: '#fff', textDecoration: 'none' }}>Contacts</Link>
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <span>Navigation Shell</span>
          <button onClick={handleLogout}>Log Out</button>
        </header>

        <main style={{ padding: '2rem', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;