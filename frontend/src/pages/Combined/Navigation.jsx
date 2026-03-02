import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/Auth/AuthContext.jsx";

const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScYWwx7_N7xtM6iyEJtOtsEtQyiroWIUEwemN_s1W-8Bk2JWg/viewform?usp=header";

function Navigation() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate("/sign-in", { replace: true });
  };

  const handleFeedbackClick = () => {
    if (window.api?.openExternalUrl) {
      window.api.openExternalUrl(FEEDBACK_FORM_URL);
    } else {
      // Fallback for non-Electron environments (e.g. browser dev)
      window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
    }
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
          <li className="nav-item nav-feedback">
            <button
              type="button"
              id="feedback-link"
              className="nav-link nav-button nav-feedback-btn"
              onClick={handleFeedbackClick}
              title="Open faculty evaluation form"
            >
              Feedback ↗
            </button>
          </li>
          <li className="nav-item nav-auth">
            {isAuthenticated ? (
              <button
                type="button"
                className="nav-link nav-button"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
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
