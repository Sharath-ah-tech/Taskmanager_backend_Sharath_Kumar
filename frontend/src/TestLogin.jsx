import { useState } from 'react';

export default function TestLogin() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpass123');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        setResult(data);
        // Test if we can store tokens
        if (data.tokens) {
          localStorage.setItem('test_access', data.tokens.access);
          console.log('Token stored successfully');
        }
      } else {
        setError(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError({ message: err.message });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Login Test</h2>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: '100%', padding: '8px', margin: '8px 0' }}
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: '100%', padding: '8px', margin: '8px 0' }}
        />
      </div>
      <button onClick={handleTest} style={{ padding: '10px 20px' }}>
        Test Login
      </button>
      
      {result && (
        <div style={{ background: '#d4edda', padding: '10px', marginTop: '10px' }}>
          <strong>✅ Success!</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      {error && (
        <div style={{ background: '#f8d7da', padding: '10px', marginTop: '10px' }}>
          <strong>❌ Error:</strong>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}