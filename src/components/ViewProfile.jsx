import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./PermissionsDemo.css";

function ViewProfile({ userId, userName, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!db || !userId) {
      setError("Invalid user ID");
      setLoading(false);
      return;
    }

    try {
      const profileRef = doc(db, "userProfiles", userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      } else {
        setError("Profile not found");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Error loading profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="permissions-demo" onClick={(e) => e.stopPropagation()}>
          <div className="demo-card authenticated-only">
            <h3>👤 {userName}'s Profile</h3>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="permissions-demo" onClick={(e) => e.stopPropagation()}>
          <div className="demo-card authenticated-only">
            <h3>👤 {userName}'s Profile</h3>
            <div className="message error">{error}</div>
            <button onClick={onClose} className="save-button">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="permissions-demo" onClick={(e) => e.stopPropagation()}>
        <div className="demo-card authenticated-only">
          <div className="profile-header-view">
            <h3>👤 {profile?.displayName || userName}'s Profile</h3>
            <button onClick={onClose} className="close-profile-btn">
              ✕ Close
            </button>
          </div>

        <div className="view-profile-content">
          <div className="profile-section">
            <h4>Display Name</h4>
            <p className="profile-value">{profile?.displayName || "Not set"}</p>
          </div>

          {profile?.favoriteCard && (
            <div className="profile-section">
              <h4>Favorite Card</h4>
              <p className="profile-value">{profile.favoriteCard}</p>
            </div>
          )}

          {profile?.bio && (
            <div className="profile-section">
              <h4>Bio</h4>
              <p className="profile-value">{profile.bio}</p>
            </div>
          )}

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{profile?.gamesPlayed || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Best Score</span>
              <span className="stat-value">{profile?.bestScore || 0}</span>
            </div>
          </div>

          {profile?.createdAt && (
            <div className="profile-section">
              <p className="profile-meta">
                Member since: {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

export default ViewProfile;

