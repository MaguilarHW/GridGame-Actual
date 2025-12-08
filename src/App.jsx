import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { auth, db } from './firebase'

function App() {
  const [count, setCount] = useState(0)
  const [firebaseConnected, setFirebaseConnected] = useState(false)

  useEffect(() => {
    // Verify Firebase connection
    if (auth && db) {
      setFirebaseConnected(true)
    }
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>GridGame</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
        {firebaseConnected && (
          <p style={{ color: '#4ade80', marginTop: '10px' }}>
            ✅ Firebase Connected Successfully!
          </p>
        )}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
