import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <nav className="nav-bar">
          <div className="nav-brand">
            <NavLink to="/">Pheydrus</NavLink>
          </div>
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/calculator" className={({ isActive }) => (isActive ? 'active' : '')}>
                Calculator
              </NavLink>
            </li>
            <li>
              <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active' : '')}>
                Chat
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 Pheydrus. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Layout;
