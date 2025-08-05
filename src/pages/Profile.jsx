import { useAuth } from "../context/AuthContext";
import { Shield } from "lucide-react";
import "./css/Profile.css";

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">Profile</h1>

        <div className="profile-info">
          <div className="info-item">
            <label className="info-label">Name</label>
            <p className="info-value">{user.name}</p>
          </div>

          <div className="info-item">
            <label className="info-label">Email</label>
            <p className="info-value">{user.email}</p>
          </div>
        </div>

        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="profile-actions">
        {/* Admin Dashboard Link for Admin Users */}
        {user.role === 'admin' && (
          <a href="/admin" className="admin-dashboard-btn">
            <Shield className="btn-icon" />
            Admin Dashboard
          </a>
        )}
      </div>
    </div>
  );
};

export default Profile;
