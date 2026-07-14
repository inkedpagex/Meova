import './globals.css';

export const metadata = {
  title: 'meetuply',
  description: 'Your campus life, all in one place.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background: '#000', color: '#fff', minHeight: '100dvh' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #333' }}>
          <h2>DUMMY LAYOUT</h2>
        </div>
        {children}
      </body>
    </html>
  );
}
