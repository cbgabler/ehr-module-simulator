import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/Auth/AuthContext.jsx";

const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScYWwx7_N7xtM6iyEJtOtsEtQyiroWIUEwemN_s1W-8Bk2JWg/viewform?usp=header";

function Navigation() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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
    <>
    {showSignOutConfirm && (
      <div className="modal-overlay" onClick={() => setShowSignOutConfirm(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Sign Out</h2>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to sign out?</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="control-btn secondary" onClick={() => setShowSignOutConfirm(false)}>
              Cancel
            </button>
            <button type="button" className="control-btn danger" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )}
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
                  onClick={() => setShowSignOutConfirm(true)}
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
    </>
  );
}

export default Navigation;
