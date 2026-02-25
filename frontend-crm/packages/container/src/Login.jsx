import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('admin@ngxcrm.com');
    const [password, setPassword] = useState('jana123');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const mutation = `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, passwordHash: $password) {
                        token
                        user {
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
                    }
                }
            `;
            const res = await axios.post('http://localhost:8080/graphql/identity', {
                query: mutation,
                variables: { email, password }
            });

            if (res.data.errors) {
                setError(res.data.errors[0].message || 'Invalid credentials');
                return;
            }

            const authResponse = res.data.data.login;
            if (authResponse && authResponse.user) {
                // Map the new User shape to the expected properties
                // We'll set role as a simple string based on the first role name
                const resolvedRole = authResponse.user.roles && authResponse.user.roles.length > 0
                    ? authResponse.user.roles[0].name
                    : 'USER';

                const loggedInUser = {
                    id: authResponse.user.id,
                    email: authResponse.user.email,
                    name: `${authResponse.user.firstName || ''} ${authResponse.user.lastName || ''}`.trim(),
                    role: resolvedRole,
                    roles: authResponse.user.roles // Keep the array for App.jsx to extract the ID
                };

                onLogin(loggedInUser);
            }
        } catch (err) {
            console.error("Login failed", err);
            setError('System error connecting to Identity service');
        }
    };

    const handleDemoClick = (roleEmail) => {
        setEmail(roleEmail);
        setPassword('jana123');
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <h2 style={{ margin: 0 }}>NGX CRM Login</h2>
                </div>
                <p className="login-subtitle">Sign in to access your dashboard</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Sign In</button>
                </form>

                <div className="demo-accounts">
                    <p>Demo Accounts:</p>
                    <div className="demo-buttons">
                        <button type="button" className="demo-btn" onClick={() => handleDemoClick('admin@ngxcrm.com')}>Admin</button>
                        <button type="button" className="demo-btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} onClick={() => handleDemoClick('sales.agent@ngxcrm.com')}>Sales Ag</button>
                        <button type="button" className="demo-btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} onClick={() => handleDemoClick('sales.manager@ngxcrm.com')}>Sales Mgr</button>
                        <button type="button" className="demo-btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} onClick={() => handleDemoClick('service.agent@ngxcrm.com')}>Service Ag</button>
                        <button type="button" className="demo-btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} onClick={() => handleDemoClick('service.manager@ngxcrm.com')}>Service Mgr</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

Login.propTypes = {
    onLogin: PropTypes.func.isRequired,
};

export default Login;
