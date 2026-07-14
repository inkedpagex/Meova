'use client';
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ padding: 40, fontFamily: 'monospace', background: '#000', color: '#ff4444', minHeight: '100vh', margin: 0 }}>
        <h2>Safe Global Error Boundary Caught an Error!</h2>
        <p style={{ color: 'white', marginBottom: 20 }}>Please screenshot this and show it to the AI:</p>
        <div style={{ background: '#222', padding: 20, borderRadius: 8 }}>
          <p><strong>Name:</strong> {error?.name || 'Unknown'}</p>
          <p><strong>Message:</strong> {error?.message || 'No message'}</p>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10, color: '#aaa', fontSize: 12 }}>{error?.stack}</pre>
        </div>
        <button onClick={() => reset()} style={{ marginTop: 20, padding: '10px 20px', background: '#fff', color: '#000', cursor: 'pointer' }}>Try Again</button>
      </body>
    </html>
  );
}
