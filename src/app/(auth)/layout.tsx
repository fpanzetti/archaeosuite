export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#f8f7f4', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <h1 style={{ fontSize:'24px', fontWeight:'500', color:'#1a6b4a' }}>ArchaeoSuite</h1>
          <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>Piattaforma per la documentazione archeologica</p>
        </div>
        {children}
      </div>
    </div>
  )
}
