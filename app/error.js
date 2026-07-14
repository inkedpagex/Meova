'use client';

export default function ErrorBoundary({ error, reset }) {
  return (
    <div style={{ 
      padding: 40, 
      fontFamily: 'monospace', 
      background: '#000', 
      color: '#ff4444', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Safe Error Boundary Caught an Error!</h2>
      <p style={{ color: 'white', margin: '20px 0' }}>Please screenshot this and show it to the AI:</p>
      
      <div style={{ background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333', maxWidth: '800px', width: '100%', textAlign: 'left' }}>
        <p><strong>Name:</strong> {error?.name || 'Unknown'}</p>
        <p><strong>Message:</strong> {error?.message || 'No message'}</p>
        <p><strong>Digest:</strong> {error?.digest || 'No digest'}</p>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          marginTop: '15px', 
          color: '#aaa', 
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto',
          padding: '10px',
          background: '#0a0a0a'
        }}>
          {error?.stack}
        </pre>
      </div>
      
      <button 
        onClick={() => reset()} 
        style={{ 
          marginTop: '30px', 
          padding: '12px 24px', 
          background: '#fff', 
          color: '#000', 
          cursor: 'pointer',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}
      >
        Try Again
      </button>
    </div>
  );
}
