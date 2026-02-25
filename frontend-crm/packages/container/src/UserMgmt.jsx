import { useState, useEffect } from 'react';
import axios from 'axios';
import './UserMgmt.css';

const API_URL = 'http://localhost:8080/graphql/identity';

const UserMgmt = () => {
    const [users, setUsers] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editingUser, setEditingUser] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = `
        query {
          getAllUsers {
            id
            email
            firstName
            lastName
            isActive
            roles {
              id
              name
            }
          }
          getRoles {
            id
            name
          }
        }
      `;
            const response = await axios.post(API_URL, { query });
            if (response.data.errors) {
                throw new Error(response.data.errors[0].message);
            }
            setUsers(response.data.data.getAllUsers);
            setAllRoles(response.data.data.getRoles);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const query = `
        mutation ToggleStatus($userId: UUID!, $isActive: Boolean!) {
          updateUserStatus(userId: $userId, isActive: $isActive) {
            id
            isActive
          }
        }
      `;
            const variables = { userId, isActive: !currentStatus };
            const response = await axios.post(API_URL, { query, variables });

            if (response.data.errors) {
                throw new Error(response.data.errors[0].message);
            }

            // Update local state
            setUsers(users.map(u =>
                u.id === userId ? { ...u, isActive: !currentStatus } : u
            ));
        } catch (err) {
            alert(`Error updating status: ${err.message}`);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setSelectedRoles(user.roles.map(r => r.id));
    };

    const closeEditModal = () => {
        setEditingUser(null);
        setSelectedRoles([]);
    };

    const handleRoleToggle = (roleId) => {
        if (selectedRoles.includes(roleId)) {
            setSelectedRoles(selectedRoles.filter(id => id !== roleId));
        } else {
            setSelectedRoles([...selectedRoles, roleId]);
        }
    };

    const saveRoles = async () => {
        try {
            const query = `
        mutation UpdateRoles($userId: UUID!, $roleIds: [UUID!]!) {
          updateUserRoles(userId: $userId, roleIds: $roleIds) {
            id
            roles {
              id
              name
            }
          }
        }
      `;
            const variables = {
                userId: editingUser.id,
                roleIds: selectedRoles
            };
            const response = await axios.post(API_URL, { query, variables });

            if (response.data.errors) {
                throw new Error(response.data.errors[0].message);
            }

            const updatedUser = response.data.data.updateUserRoles;

            // Update local state
            setUsers(users.map(u =>
                u.id === editingUser.id ? { ...u, roles: updatedUser.roles } : u
            ));

            closeEditModal();
        } catch (err) {
            alert(`Error updating roles: ${err.message}`);
        }
    };

    if (loading) return <div className="loading">Loading User Management...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="usermgmt-container">
            <div className="usermgmt-header">
                <h2>User Management</h2>
            </div>

            <table className="usermgmt-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</td>
                            <td>{user.email}</td>
                            <td>
                                {user.roles && user.roles.length > 0 ? (
                                    user.roles.map(role => (
                                        <span key={role.id} className="role-badge">{role.name}</span>
                                    ))
                                ) : (
                                    <span className="role-badge" style={{ backgroundColor: '#999' }}>NONE</span>
                                )}
                            </td>
                            <td>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={user.isActive}
                                        onChange={() => toggleUserStatus(user.id, user.isActive)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </td>
                            <td>
                                <button className="btn-edit" onClick={() => openEditModal(user)}>
                                    Edit Roles
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Roles for {editingUser.email}</h3>
                        <div className="roles-selection">
                            {allRoles.map(role => (
                                <label key={role.id}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role.id)}
                                        onChange={() => handleRoleToggle(role.id)}
                                    />
                                    {role.name}
                                </label>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeEditModal}>Cancel</button>
                            <button className="btn-primary" onClick={saveRoles}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMgmt;
