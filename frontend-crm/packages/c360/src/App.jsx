import { useState, useEffect } from 'react';
import axios from 'axios';

// ==================== C360 CONTENT ====================
function C360Content() {
  const [data, setData] = useState({ accounts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', industry: '', tier: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const hasPermission = (field, action) => {
    if (!window.__CRM_PERMISSIONS__) return true;
    const perm = window.__CRM_PERMISSIONS__.find(p => p.module === 'c360' && p.fieldName === field);
    if (!perm) return true;
    return action === 'read' ? perm.canRead : perm.canWrite;
  };

  const fetchAccounts = async () => {
    try {
      const query = `
        query GetAccounts {
          accounts {
            id
            name
            industry
            tier
          }
        }
      `;
      const response = await axios.post('http://localhost:8080/graphql/c360', {
        query
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.errors) throw new Error(response.data.errors[0].message);
      setData(response.data.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const mutation = `
        mutation CreateAccount($name: String!, $industry: String, $tier: String) {
          createAccount(name: $name, industry: $industry, tier: $tier) { id }
        }
      `;
      await axios.post('http://localhost:8080/graphql/c360', {
        query: mutation,
        variables: newAccount
      });
      setIsModalOpen(false);
      setNewAccount({ name: '', industry: '', tier: '' });
      fetchAccounts(); // Refresh data
    } catch (err) {
      console.error("Create failed", err);
      alert("Failed to create account.");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const mutation = `
        mutation UpdateAccount($id: ID!, $name: String, $industry: String, $tier: String) {
          updateAccount(id: $id, name: $name, industry: $industry, tier: $tier) { id }
        }
      `;
      await axios.post('http://localhost:8080/graphql/c360', {
        query: mutation,
        variables: { id, ...editFormData }
      });
      setEditingId(null);
      fetchAccounts(); // Refresh data
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update account.");
    }
  };

  if (loading) return <p style={{ color: '#0288D1' }}>Loading customer data...</p>;
  if (error) return <p style={{ color: '#D32F2F' }}>Error loading data. Is the backend running?</p>;

  return (
    <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(2, 136, 209, 0.05)', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#0288D1', marginTop: 0, marginBottom: '4px' }}>Customer 360</h2>
          <p style={{ color: '#4B5563', margin: 0 }}>Overview of customer activities and interactions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ background: '#0288D1', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          + New Account
        </button>
      </div>

      <div style={{ marginTop: '20px', display: 'grid', gap: '15px' }}>
        {data.accounts.map((account, index) => (
          <div key={account.id} style={{
            padding: '15px',
            borderLeft: `4px solid ${index % 2 === 0 ? '#0288D1' : '#03A9F4'}`,
            background: index % 2 === 0 ? 'rgba(2,136,209,0.05)' : 'rgba(3,169,244,0.05)',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              {editingId === account.id ? (
                <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="text" placeholder="Account Name" defaultValue={account.name} disabled={!hasPermission('name', 'write')} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} style={{ padding: '4px', fontWeight: 'bold' }} />
                  <input type="text" placeholder="Industry" defaultValue={account.industry} disabled={!hasPermission('industry', 'write')} onChange={e => setEditFormData({ ...editFormData, industry: e.target.value })} style={{ padding: '4px' }} />
                  <select defaultValue={account.tier} disabled={!hasPermission('tier', 'write')} onChange={e => setEditFormData({ ...editFormData, tier: e.target.value })} style={{ padding: '4px' }}>
                    <option value="Enterprise">Enterprise</option>
                    <option value="SMB">SMB</option>
                    <option value="Startup">Startup</option>
                  </select>
                  <button onClick={() => handleUpdate(account.id)} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ background: '#6B7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>Cancel</button>
                </div>
              ) : (
                <span>
                  <strong>{hasPermission('name', 'read') ? account.name : '***'}</strong> -
                  {hasPermission('industry', 'read') ? (account.industry || 'Unknown Industry') : '***'}
                  ({hasPermission('tier', 'read') ? (account.tier || 'Standard') : '***'})
                </span>
              )}
            </div>
            {editingId !== account.id && (
              <button onClick={() => { setEditingId(account.id); setEditFormData({ name: account.name, industry: account.industry, tier: account.tier }); }} style={{ background: 'transparent', color: '#0288D1', border: '1px solid #0288D1', borderRadius: '4px', cursor: 'pointer', padding: '4px 12px' }}>Edit</button>
            )}
          </div>
        ))}
        {data.accounts.length === 0 && (
          <p style={{ color: '#6B7280' }}>No customer accounts found.</p>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0288D1' }}>Create New Account</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required placeholder="Account Name *" value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
              <input placeholder="Industry" value={newAccount.industry} onChange={e => setNewAccount({ ...newAccount, industry: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
              <select value={newAccount.tier} onChange={e => setNewAccount({ ...newAccount, tier: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                <option value="">Select Tier...</option>
                <option value="Enterprise">Enterprise</option>
                <option value="SMB">SMB</option>
                <option value="Startup">Startup</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#E5E7EB', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#0288D1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
function App() {
  return <C360Content />;
}

export default App;
