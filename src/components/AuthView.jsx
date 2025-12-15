import { useState } from "react";
import { motion } from "motion/react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import "./AuthView.css";

function AuthView({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="game-title">🌾 Farm Grid Game 🌾</h1>
          <p className="game-tagline">Pastel farm strategy on a 5x5 grid</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {isLogin ? (
          <LoginForm onSuccess={onAuthSuccess} onError={setError} />
        ) : (
          <SignUpForm onSuccess={onAuthSuccess} onError={setError} />
        )}
      </div>
    </div>
  );
}

export default AuthView;

