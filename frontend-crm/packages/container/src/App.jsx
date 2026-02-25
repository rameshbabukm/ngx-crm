import React, { useState, Suspense, useEffect } from 'react';
import './App.css';
import Login from './Login';
import ErrorBoundary from './ErrorBoundary';
import AccessMgmt from './AccessMgmt';
import UserMgmt from './UserMgmt';
import axios from 'axios';

// Lazy load remotes
const C360App = React.lazy(() => import('c360/App'));
const SalesApp = React.lazy(() => import('sales/App'));
const ServiceApp = React.lazy(() => import('service/App'));

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('c360');

  useEffect(() => {
    console.log('--- DEBUG TRIGGERING REMOTE IMPORT ---');
    import('c360/App')
      .then(mod => {
        console.log('DEBUG c360 MODULE SUCCESS:', mod);
        console.log('DEBUG c360 DEFAULT EXPORT:', mod.default, typeof mod.default);
      })
      .catch(err => {
        console.error('DEBUG c360 IMPORT ERROR:', err);
      });
  }, []);

  const handleLogin = async (loggedInUser) => {
    setUser(loggedInUser);

    // Fetch and inject permissions for the user
    try {
      const query = `
        query GetPerms($roleId: UUID!) {
          getPermissionsByRole(roleId: $roleId) {
            module
            fieldName
            canRead
            canWrite
          }
        }
      `;
      // We assume loggedInUser.roles is an array, we pull the first role's ID
      // If the login response doesn't give role ID, we might need a workaround.
      // Wait, the identity schema for Role doesn't have permissions directly on User in AuthResponse,
      // it has roles: [Role!]! on User. Let's assume the first role.

      const roleId = loggedInUser.roles && loggedInUser.roles.length > 0 ? loggedInUser.roles[0].id : null;

      if (roleId) {
        const res = await axios.post('http://localhost:8080/graphql/identity', {
          query,
          variables: { roleId }
        });

        if (res.data.data.getPermissionsByRole) {
          window.__CRM_PERMISSIONS__ = res.data.data.getPermissionsByRole;
          console.log("Injected CRM Permissions globally: ", window.__CRM_PERMISSIONS__);
        } else {
          window.__CRM_PERMISSIONS__ = [];
        }
      } else {
        window.__CRM_PERMISSIONS__ = [];
      }
    } catch (err) {
      console.error("Failed to load global permissions", err);
      window.__CRM_PERMISSIONS__ = [];
    }

    // Default route based on persona
    if (loggedInUser.role === 'SALES') {
      setCurrentView('sales');
    } else {
      setCurrentView('c360');
    }
  };

  const handleLogout = () => {
    setUser(null);
    window.__CRM_PERMISSIONS__ = [];
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Persona-based access control
  const canViewAdmin = user.role === 'ADMIN';
  const canViewC360 = user.role === 'ADMIN' || user.role === 'SUPPORT' || user.role === 'SERVICE_AGENT' || user.role === 'SERVICE_MANAGER' || user.role === 'SALES_AGENT' || user.role === 'SALES_MANAGER';
  const canViewSales = user.role === 'ADMIN' || user.role === 'SALES' || user.role === 'SALES_AGENT' || user.role === 'SALES_MANAGER';
  const canViewService = user.role === 'ADMIN' || user.role === 'SUPPORT' || user.role === 'SERVICE_AGENT' || user.role === 'SERVICE_MANAGER';

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          NGX CRM
        </div>
        <div className="navbar-nav">
          {canViewC360 && (
            <div
              className={`nav-link ${currentView === 'c360' ? 'active' : ''}`}
              onClick={() => setCurrentView('c360')}
            >
              Customer 360
            </div>
          )}
          {canViewSales && (
            <div
              className={`nav-link ${currentView === 'sales' ? 'active' : ''}`}
              onClick={() => setCurrentView('sales')}
            >
              Sales & Leads
            </div>
          )}
          {canViewService && (
            <div
              className={`nav-link ${currentView === 'service' ? 'active' : ''}`}
              onClick={() => setCurrentView('service')}
            >
              Customer Service
            </div>
          )}
          {canViewAdmin && (
            <div
              className={`nav-link ${currentView === 'access_mgmt' ? 'active' : ''}`}
              onClick={() => setCurrentView('access_mgmt')}
            >
              Access Mgmt
            </div>
          )}
          {canViewAdmin && (
            <div
              className={`nav-link ${currentView === 'user_mgmt' ? 'active' : ''}`}
              onClick={() => setCurrentView('user_mgmt')}
            >
              User Mgmt
            </div>
          )}
        </div>
        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '16px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
            {user.name} ({user.role})
          </span>
          <button style={{ padding: '6px 12px', fontSize: '0.85em' }} className="demo-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<div className="loading-spinner"></div>}>
            {currentView === 'c360' && canViewC360 && <C360App />}
            {currentView === 'sales' && canViewSales && <SalesApp />}
            {currentView === 'service' && canViewService && <ServiceApp />}
            {currentView === 'access_mgmt' && canViewAdmin && <AccessMgmt />}
            {currentView === 'user_mgmt' && canViewAdmin && <UserMgmt />}
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="footer">
        <p>&copy; 2026 NGX CRM Application. Sky Blue Theme.</p>
      </footer>
    </div>
  );
}

export default App;
