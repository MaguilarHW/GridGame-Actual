import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import "./PermissionsDemo.css";

function UserProfile() {
  const [profile, setProfile] = useState({
    displayName: "",
    favoriteCard: "",
    bio: "",
    gamesPlayed: 0,
    bestScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!auth?.currentUser || !db) {
      setLoading(false);
      return;
    }

    try {
      const profileRef = doc(db, "userProfiles", auth.currentUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      } else {
        // Create default profile
        const defaultProfile = {
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Player",
          favoriteCard: "",
          bio: "",
          gamesPlayed: 0,
          bestScore: 0,
          createdAt: new Date().toISOString(),
        };
        await setDoc(profileRef, defaultProfile);
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage("Error loading profile. You may not have permission to access this.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth?.currentUser || !db) {
      setMessage("Not authenticated. Please log in.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const profileRef = doc(db, "userProfiles", auth.currentUser.uid);
      await updateDoc(profileRef, {
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      setMessage("Profile saved successfully! ✅");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error saving profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="permissions-demo">
        <div className="demo-card authenticated-only">
          <h3>🔒 User Profile (Authenticated Only)</h3>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="permissions-demo">
      <div className="demo-card authenticated-only">
        <h3>🔒 User Profile (Authenticated Only)</h3>
        <p className="permission-info">
          This content is only accessible to logged-in users. You can only view
          and edit your own profile.
        </p>

        {message && (
          <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <div className="profile-form">
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              placeholder="Your display name"
            />
          </div>

          <div className="form-group">
            <label>Favorite Card</label>
            <select
              value={profile.favoriteCard}
              onChange={(e) =>
                setProfile({ ...profile, favoriteCard: e.target.value })
              }
            >
              <option value="">Select a card</option>
              <option value="🌾 Wheat">🌾 Wheat</option>
              <option value="🌽 Corn">🌽 Corn</option>
              <option value="🐔 Chicken">🐔 Chicken</option>
              <option value="🐄 Cow">🐄 Cow</option>
              <option value="🚜 Tractor">🚜 Tractor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-label">Games Played:</span>
              <span className="stat-value">{profile.gamesPlayed}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Best Score:</span>
              <span className="stat-value">{profile.bestScore}</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="save-button"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;

