import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/Auth/AuthContext.jsx";

function Navigation() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate("/sign-in", { replace: true });
  };

  return (
    <div className="app-navigation">
      <nav>
        <div className="nav-brand">EHR Simulator</div>
        <ul className="nav">
          {isAuthenticated && (
            <li className="nav-item">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Home
              </NavLink>
            </li>
          )}
          {isAuthenticated && (
            <li className="nav-item">
              <NavLink
                to="/quizzes"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Quizzes
              </NavLink>
            </li>
          )}
          <li className="nav-item nav-auth">
            {isAuthenticated ? (
              <div className="nav-user-area">
                <div className="nav-user-info">
                  <div className="nav-user-avatar">
                    {user?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="nav-user-details">
                    <span className="nav-user-name">{user?.username}</span>
                    <span className={`nav-user-role nav-user-role--${user?.role}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="nav-link nav-button"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <NavLink
                to="/sign-in"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Sign In
              </NavLink>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Navigation;
