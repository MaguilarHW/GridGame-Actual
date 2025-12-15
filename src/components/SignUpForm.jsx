import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import "./AuthView.css";

function SignUpForm({ onSuccess, onError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!auth) {
      onError("Firebase is not configured. Please check your setup.");
      return;
    }

    setLoading(true);
    onError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // Update the user's display name
      if (username.trim()) {
        await updateProfile(userCredential.user, {
          displayName: username.trim(),
        });
      }
      
      onSuccess();
    } catch (error) {
      onError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider) => {
    if (!auth) {
      onError("Firebase is not configured. Please check your setup.");
      return;
    }

    setLoading(true);
    onError("");

    try {
      let authProvider;
      switch (provider) {
        case "google":
          authProvider = new GoogleAuthProvider();
          break;
        case "facebook":
          authProvider = new FacebookAuthProvider();
          break;
        case "apple":
          authProvider = new OAuthProvider("apple.com");
          break;
        default:
          throw new Error("Unknown provider");
      }

      await signInWithPopup(auth, authProvider);
      onSuccess();
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        onError(getErrorMessage(error.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/operation-not-allowed":
        return "Email/password accounts are not enabled.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/popup-closed-by-user":
        return "";
      case "auth/popup-blocked":
        return "Popup was blocked. Please allow popups and try again.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with a different sign-in method.";
      default:
        return "Sign up failed. Please try again.";
    }
  };

  return (
    <div className="auth-form">
      <form onSubmit={handleEmailSignUp}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            disabled={loading}
          />
          <small className="form-hint">At least 6 characters</small>
        </div>

        <button
          type="submit"
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <div className="oauth-buttons">
        <button
          type="button"
          className="oauth-button google"
          onClick={() => handleOAuthSignUp("google")}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.8 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.951H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.049l2.007-1.342z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.951L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          className="oauth-button facebook"
          onClick={() => handleOAuthSignUp("facebook")}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 9c0-4.97-4.03-9-9-9S0 4.03 0 9c0 4.42 3.21 8.08 7.41 8.84v-6.26H5.31V9h2.1V7.01c0-2.08 1.24-3.23 3.13-3.23.91 0 1.86.16 1.86.16v2.05h-1.05c-1.03 0-1.35.64-1.35 1.3V9h2.31l-.37 2.58h-1.94v6.26C14.79 17.08 18 13.42 18 9z"
              fill="#1877F2"
            />
          </svg>
          Continue with Meta
        </button>

        <button
          type="button"
          className="oauth-button apple"
          onClick={() => handleOAuthSignUp("apple")}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 1.5c-.45.9-1.2 1.5-2.1 1.5-.15 0-.3 0-.45-.15.15-.15.3-.3.45-.6.75-.3 1.5-.9 2.1-1.5zm-1.5 3c-1.05 0-1.95.6-2.55.6-.6 0-1.5-.6-2.55-.6-1.2 0-2.4.75-3.15 1.95C2.4 7.95 2.85 9.9 3.6 11.1c.6.9 1.35 1.95 2.4 1.95.9 0 1.35-.45 2.55-.45 1.2 0 1.65.45 2.55.45 1.05 0 1.8-1.05 2.4-1.95.45-.75.75-1.5.9-2.4-.9-.3-1.65-1.05-1.95-2.1-.3-1.05-.15-2.1.3-2.85-.75-.45-1.65-.75-2.55-.75z"
              fill="#000000"
            />
          </svg>
          Continue with Apple
        </button>
      </div>
    </div>
  );
}

export default SignUpForm;

