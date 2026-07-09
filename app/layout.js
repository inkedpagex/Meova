import './globals.css';
import Sidebar from '../components/Sidebar';
import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { adminAuth, isFirebaseAdminConfigured } from '../lib/firebaseAdmin';

export const metadata = {
  title: 'meetuply',
  description: 'Your campus life, all in one place.',
};

export default async function RootLayout({ children }) {
  let user = null;

  if (isFirebaseAdminConfigured && adminAuth) {
    const fetchedUser = await getUserWithRole();
    if (fetchedUser) {
      try {
        const wallet = await getOrCreateWallet(fetchedUser.uid, fetchedUser.email);
        user = {
          ...fetchedUser,
          wallet,
        };
      } catch (err) {
        user = fetchedUser;
      }
    }
  }

  if (!isFirebaseAdminConfigured) {
    return (
      <html lang="en">
        <body style={{ background:'#080808', color:'#f2f2f2', fontFamily:'system-ui, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100dvh', margin:0 }}>
          <div style={{ maxWidth:420, textAlign:'center', padding:'40px 24px' }}>
            <div style={{ width:56,height:56,background:'white',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28,fontWeight:900,color:'#000' }}>M</div>
            <h2 style={{ fontSize:20,fontWeight:700,marginBottom:12 }}>Firebase Setup Required</h2>
            <p style={{ color:'#666',fontSize:13,lineHeight:1.6,marginBottom:20 }}>
              Open <code style={{ background:'#111',padding:'2px 6px',borderRadius:4,fontSize:12 }}>.env.local</code> and add your Firebase credentials, then restart.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body style={{ background:'var(--bg-base)', color:'var(--text-primary)', minHeight:'100dvh' }}>
        <div className="flex min-h-screen">
          <Sidebar user={user} />

          {/* Main content offset for sidebar (desktop) / top+bottom bar (mobile) */}
          <div className="flex-1 md:pl-[220px] min-w-0">
            <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 80px', paddingTop: 72 }}
              className="md:!pt-8 md:!pb-8 md:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
