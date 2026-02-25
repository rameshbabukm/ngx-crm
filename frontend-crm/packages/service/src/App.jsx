import { useState, useEffect } from 'react';
import axios from 'axios';

// ==================== SERVICE CONTENT ====================
function ServiceContent() {
  const [data, setData] = useState({ getCases: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({ subject: '', description: '', priority: 'Medium' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const hasPermission = (field, action) => {
    if (!window.__CRM_PERMISSIONS__) return true;
    const perm = window.__CRM_PERMISSIONS__.find(p => p.module === 'service' && p.fieldName === field);
    if (!perm) return true;
    return action === 'read' ? perm.canRead : perm.canWrite;
  };

  const fetchCases = async () => {
    try {
      const query = `
        query GetCases {
          getCases {
            id
            subject
            description
            priority
            status
          }
        }
      `;
      const response = await axios.post('http://localhost:8080/graphql/service', {
        query
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.errors) throw new Error(response.data.errors[0].message);
      setData({ getCases: response.data.data.getCases || [] });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const mutation = `
        mutation CreateCase($subject: String!, $description: String, $priority: String) {
          createCase(subject: $subject, description: $description, priority: $priority) { id }
        }
      `;
      await axios.post('http://localhost:8080/graphql/service', {
        query: mutation,
        variables: newCase
      });
      setIsModalOpen(false);
      setNewCase({ subject: '', description: '', priority: 'Medium' });
      fetchCases();
    } catch (err) {
      console.error("Create failed", err);
      alert("Failed to create case.");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const mutation = `
        mutation UpdateCaseStatus($id: ID!, $status: String!) {
          updateCaseStatus(id: $id, status: $status) { id status }
        }
      `;
      await axios.post('http://localhost:8080/graphql/service', {
        query: mutation,
        variables: { id, status }
      });
      fetchCases();
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update status.");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const mutation = `
        mutation UpdateCase($id: ID!, $subject: String, $description: String, $priority: String) {
          updateCase(id: $id, subject: $subject, description: $description, priority: $priority) { id }
        }
      `;
      await axios.post('http://localhost:8080/graphql/service', {
        query: mutation,
        variables: { id, ...editFormData }
      });
      setEditingId(null);
      fetchCases(); // Refresh data
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update case.");
    }
  };

  if (loading) return <p style={{ color: '#0288D1' }}>Loading support cases...</p>;
  if (error) return <p style={{ color: '#D32F2F' }}>Error loading data. Is the backend running?</p>;

  return (
    <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgba(2, 136, 209, 0.05)', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#0288D1', marginTop: 0, marginBottom: '4px' }}>Customer Service</h2>
          <p style={{ color: '#4B5563', margin: 0 }}>Track and resolve customer support cases.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ background: '#0288D1', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          + New Case
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {data.getCases.map((appCase) => (
          <div key={appCase.id} style={{
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px',
            background: '#F9FAFB',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            borderTop: `4px solid ${appCase.priority === 'High' ? '#DC2626' : (appCase.priority === 'Medium' ? '#F59E0B' : '#0288D1')}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              {editingId === appCase.id ? (
                <input type="text" placeholder="Subject" defaultValue={appCase.subject} disabled={!hasPermission('subject', 'write')} onChange={e => setEditFormData({ ...editFormData, subject: e.target.value })} style={{ padding: '4px', fontWeight: 'bold', width: '60%' }} />
              ) : (
                <strong style={{ fontSize: '1.1em', color: '#111827' }}>{hasPermission('subject', 'read') ? appCase.subject : '***'}</strong>
              )}
              <select
                value={appCase.status}
                disabled={!hasPermission('status', 'write')}
                onChange={(e) => handleStatusUpdate(appCase.id, e.target.value)}
                style={{
                  background: appCase.status === 'Open' ? '#fee2e2' : (appCase.status === 'In Progress' ? '#fef3c7' : '#dcfce7'),
                  color: !hasPermission('status', 'read') ? 'transparent' : appCase.status === 'Open' ? '#991b1b' : (appCase.status === 'In Progress' ? '#92400e' : '#166534'),
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8em',
                  fontWeight: '600',
                  border: 'none',
                  cursor: hasPermission('status', 'write') ? 'pointer' : 'not-allowed',
                  outline: 'none'
                }}
              >
                <option value="NEW">{hasPermission('status', 'read') ? 'NEW' : '***'}</option>
                <option value="Open">{hasPermission('status', 'read') ? 'Open' : '***'}</option>
                <option value="In Progress">{hasPermission('status', 'read') ? 'In Progress' : '***'}</option>
                <option value="Resolved">{hasPermission('status', 'read') ? 'Resolved' : '***'}</option>
                <option value="Closed">{hasPermission('status', 'read') ? 'Closed' : '***'}</option>
              </select>
            </div>
            {editingId === appCase.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea placeholder="Description" defaultValue={appCase.description} disabled={!hasPermission('description', 'write')} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} style={{ padding: '4px', minHeight: '60px', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.9em', color: '#6B7280' }}>Priority:</span>
                  <select defaultValue={appCase.priority} disabled={!hasPermission('priority', 'write')} onChange={e => setEditFormData({ ...editFormData, priority: e.target.value })} style={{ padding: '4px' }}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => handleUpdate(appCase.id)} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 12px' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ background: '#6B7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 12px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {appCase.description ? (
                  <p style={{ margin: '5px 0', color: '#4B5563', fontSize: '0.9em' }}>{hasPermission('description', 'read') ? appCase.description : '***'}</p>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <p style={{ margin: '0', color: '#6B7280', fontSize: '0.9em' }}>Priority: <strong>{hasPermission('priority', 'read') ? appCase.priority : '***'}</strong></p>
                  <button onClick={() => { setEditingId(appCase.id); setEditFormData({ subject: appCase.subject, description: appCase.description, priority: appCase.priority }); }} style={{ background: 'transparent', color: '#0288D1', border: '1px solid #0288D1', borderRadius: '4px', cursor: 'pointer', padding: '4px 12px' }}>Edit</button>
                </div>
              </>
            )}
          </div>
        ))}
        {data.getCases.length === 0 && (
          <p style={{ color: '#6B7280', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>No support cases found.</p>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0288D1' }}>Create New Support Case</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required placeholder="Subject / Title *" value={newCase.subject} onChange={e => setNewCase({ ...newCase, subject: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
              <textarea placeholder="Description" value={newCase.description} onChange={e => setNewCase({ ...newCase, description: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', minHeight: '80px', fontFamily: 'inherit' }} />
              <select value={newCase.priority} onChange={e => setNewCase({ ...newCase, priority: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
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
  return <ServiceContent />;
}

export default App;
