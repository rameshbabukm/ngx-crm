import { useState, useEffect } from 'react';
import axios from 'axios';

// ==================== SALES CONTENT ====================
function SalesContent() {
  const [data, setData] = useState({ getLeads: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', company: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const hasPermission = (field, action) => {
    if (!window.__CRM_PERMISSIONS__) return true;
    const perm = window.__CRM_PERMISSIONS__.find(p => p.module === 'sales' && p.fieldName === field);
    if (!perm) return true;
    return action === 'read' ? perm.canRead : perm.canWrite;
  };

  const fetchLeads = async () => {
    try {
      const query = `
        query GetLeads {
          getLeads {
            id
            name
            email
            company
            status
          }
        }
      `;
      const response = await axios.post('http://localhost:8080/graphql/sales', {
        query
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.errors) throw new Error(response.data.errors[0].message);
      setData({ getLeads: response.data.data.getLeads || [] });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const mutation = `
        mutation CreateLead($name: String!, $email: String!, $company: String!) {
          createLead(name: $name, email: $email, company: $company) { id }
        }
      `;
      await axios.post('http://localhost:8080/graphql/sales', {
        query: mutation,
        variables: newLead
      });
      setIsModalOpen(false);
      setNewLead({ name: '', email: '', company: '' });
      fetchLeads();
    } catch (err) {
      console.error("Create failed", err);
      alert("Failed to create lead.");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const mutation = `
        mutation UpdateLeadStatus($id: ID!, $status: String!) {
          updateLeadStatus(id: $id, status: $status) { id status }
        }
      `;
      await axios.post('http://localhost:8080/graphql/sales', {
        query: mutation,
        variables: { id, status }
      });
      fetchLeads();
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update status.");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const mutation = `
        mutation UpdateLead($id: ID!, $name: String, $email: String, $company: String) {
          updateLead(id: $id, name: $name, email: $email, company: $company) { id }
        }
      `;
      await axios.post('http://localhost:8080/graphql/sales', {
        query: mutation,
        variables: { id, ...editFormData }
      });
      setEditingId(null);
      fetchLeads(); // Refresh data
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update lead.");
    }
  };

  if (loading) return <p style={{ color: '#0288D1' }}>Loading sales data...</p>;
  if (error) return <p style={{ color: '#D32F2F' }}>Error loading data. Is the backend running?</p>;

  return (
    <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(2, 136, 209, 0.05)', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#0288D1', marginTop: 0, marginBottom: '4px' }}>Sales & Leads</h2>
          <p style={{ color: '#4B5563', margin: 0 }}>Manage the sales pipeline and incoming leads.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ background: '#0288D1', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          + New Lead
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ padding: '10px', color: '#374151' }}>Lead Info</th>
              <th style={{ padding: '10px', color: '#374151' }}>Company</th>
              <th style={{ padding: '10px', color: '#374151', width: '150px' }}>Status</th>
              <th style={{ padding: '10px', color: '#374151', width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.getLeads.map((lead) => (
              <tr key={lead.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                {editingId === lead.id ? (
                  <>
                    <td style={{ padding: '10px' }}>
                      <input type="text" placeholder="Name" defaultValue={lead.name} disabled={!hasPermission('name', 'write')} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} style={{ padding: '4px', display: 'block', marginBottom: '4px', width: '100%' }} />
                      <input type="text" placeholder="Email" defaultValue={lead.email} disabled={!hasPermission('email', 'write')} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} style={{ padding: '4px', display: 'block', width: '100%' }} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <input type="text" placeholder="Company" defaultValue={lead.company} disabled={!hasPermission('company', 'write')} onChange={e => setEditFormData({ ...editFormData, company: e.target.value })} style={{ padding: '4px', width: '100%' }} />
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: '500' }}>{hasPermission('name', 'read') ? lead.name : '***'}</div>
                      <div style={{ fontSize: '0.85em', color: '#6B7280' }}>{hasPermission('email', 'read') ? lead.email : '***'}</div>
                    </td>
                    <td style={{ padding: '10px', color: '#6B7280' }}>{hasPermission('company', 'read') ? lead.company : '***'}</td>
                  </>
                )}
                <td style={{ padding: '10px' }}>
                  <select
                    value={lead.status}
                    disabled={!hasPermission('status', 'write')}
                    onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                    style={{
                      background: lead.status === 'NEW' ? '#dcfce7' : (lead.status === 'CONTACTED' ? '#fef3c7' : '#e0e7ff'),
                      color: !hasPermission('status', 'read') ? 'transparent' : lead.status === 'NEW' ? '#166534' : (lead.status === 'CONTACTED' ? '#92400e' : '#3730a3'),
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      fontWeight: '500',
                      border: 'none',
                      cursor: hasPermission('status', 'write') ? 'pointer' : 'not-allowed',
                      outline: 'none'
                    }}
                  >
                    <option value="NEW">{hasPermission('status', 'read') ? 'NEW' : '***'}</option>
                    <option value="CONTACTED">{hasPermission('status', 'read') ? 'CONTACTED' : '***'}</option>
                    <option value="QUALIFIED">{hasPermission('status', 'read') ? 'QUALIFIED' : '***'}</option>
                    <option value="LOST">{hasPermission('status', 'read') ? 'LOST' : '***'}</option>
                  </select>
                </td>
                <td style={{ padding: '10px' }}>
                  {editingId === lead.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleUpdate(lead.id)} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ background: '#6B7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(lead.id); setEditFormData({ name: lead.name, email: lead.email, company: lead.company }); }} style={{ background: 'transparent', color: '#0288D1', border: '1px solid #0288D1', borderRadius: '4px', cursor: 'pointer', padding: '4px 12px' }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
            {data.getLeads.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#6B7280' }}>No leads found.</td>
              </tr>

            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0288D1' }}>Create New Lead</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required placeholder="Lead Name *" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
              <input required type="email" placeholder="Email Address *" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
              <input required placeholder="Company *" value={newLead.company} onChange={e => setNewLead({ ...newLead, company: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
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
  return <SalesContent />;
}

export default App;
