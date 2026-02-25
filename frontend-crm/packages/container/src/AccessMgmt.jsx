import { useState, useEffect } from 'react';
import axios from 'axios';
import './AccessMgmt.css';

const MODULES = [
    { id: 'c360', label: 'Customer 360', fields: ['industry', 'tier', 'website', 'name'] },
    { id: 'sales', label: 'Sales & Leads', fields: ['status', 'name', 'email', 'company'] },
    { id: 'service', label: 'Customer Service', fields: ['subject', 'description', 'priority', 'status'] }
];

const AccessMgmt = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            fetchPermissions(selectedRole);
        } else {
            setPermissions([]);
        }
    }, [selectedRole]);

    const fetchRoles = async () => {
        try {
            const query = `
        query {
          getRoles {
            id
            name
          }
        }
      `;
            const res = await axios.post('http://localhost:8080/graphql/identity', { query });
            if (res.data.data.getRoles) {
                setRoles(res.data.data.getRoles);
                if (res.data.data.getRoles.length > 0) {
                    setSelectedRole(res.data.data.getRoles[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch roles", err);
        }
    };

    const fetchPermissions = async (roleId) => {
        setLoading(true);
        try {
            const query = `
        query GetPermissions($roleId: UUID!) {
          getPermissionsByRole(roleId: $roleId) {
            module
            fieldName
            canRead
            canWrite
          }
        }
      `;
            const res = await axios.post('http://localhost:8080/graphql/identity', {
                query,
                variables: { roleId }
            });
            if (res.data.data.getPermissionsByRole) {
                setPermissions(res.data.data.getPermissionsByRole);
            }
        } catch (err) {
            console.error("Failed to fetch permissions", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (module, fieldName, type, currentValue) => {
        // Find existing to know both read & write
        const existing = permissions.find(p => p.module === module && p.fieldName === fieldName) ||
            { canRead: true, canWrite: false }; // Defaults if none exists

        const newCanRead = type === 'read' ? !currentValue : existing.canRead;
        const newCanWrite = type === 'write' ? !currentValue : existing.canWrite;

        // Enforce logic: if writing is enabled, reading must be enabled
        let finalRead = newCanRead;
        let finalWrite = newCanWrite;

        if (type === 'write' && finalWrite) {
            finalRead = true;
        }
        if (type === 'read' && !finalRead) {
            finalWrite = false;
        }

        try {
            const mutation = `
        mutation SetPerm($roleId: UUID!, $module: String!, $fieldName: String!, $canRead: Boolean!, $canWrite: Boolean!) {
                setFieldPermission(roleId: $roleId, module: $module, fieldName: $fieldName, canRead: $canRead, canWrite: $canWrite) {
                    canRead
                    canWrite
                }
            }
            `;
            await axios.post('http://localhost:8080/graphql/identity', {
                query: mutation,
                variables: { roleId: selectedRole, module, fieldName, canRead: finalRead, canWrite: finalWrite }
            });
            // Refresh
            fetchPermissions(selectedRole);
        } catch (err) {
            console.error("Failed to update permission", err);
            alert("Error updating permission");
        }
    };

    const getPermissionVal = (module, fieldName, type) => {
        const perm = permissions.find(p => p.module === module && p.fieldName === fieldName);
        if (!perm) return type === 'read' ? true : false; // Defaults
        return type === 'read' ? perm.canRead : perm.canWrite;
    };

    return (
        <div className="access-mgmt">
            <div className="access-header">
                <h2>Field Level Security</h2>
                <div className="role-selector">
                    <label>Select Role: </label>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                <div className="modules-grid">
                    {MODULES.map(mod => (
                        <div key={mod.id} className="module-card">
                            <h3>{mod.label}</h3>
                            <table className="perm-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Read</th>
                                        <th>Write</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mod.fields.map(f => {
                                        const canRead = getPermissionVal(mod.id, f, 'read');
                                        const canWrite = getPermissionVal(mod.id, f, 'write');
                                        return (
                                            <tr key={f}>
                                                <td style={{ textTransform: 'capitalize' }}>{f}</td>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={canRead}
                                                        onChange={() => handleToggle(mod.id, f, 'read', canRead)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={canWrite}
                                                        onChange={() => handleToggle(mod.id, f, 'write', canWrite)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AccessMgmt;
