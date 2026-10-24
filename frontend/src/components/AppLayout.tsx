import { Outlet, NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/catalog', label: 'Catálogo' },
  { to: '/recipes', label: 'Recetas' },
  { to: '/production', label: 'Producción' },
  { to: '/closures', label: 'Cierres' },
  { to: '/transfers', label: 'Transferencias' },
  { to: '/waste', label: 'Mermas' },
  { to: '/inventory', label: 'Inventario' },
  { to: '/users', label: 'Usuarios' },
];

export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, borderRight: '1px solid #eee', padding: 16 }}>
        <h2 style={{ margin: '0 0 16px' }}>Walters Bakery</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {links.map((l) => (
            <li key={l.to} style={{ marginBottom: 8 }}>
              <NavLink
                to={l.to}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '8px 10px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#222',
                  background: isActive ? '#1f6feb' : 'transparent',
                })}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
