// App.tsx
import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom';
import Home from './Home';
import PDFWithNotes from './PDFWithNotes';
import Login from './Login';
import Signup from './Signup';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import './styles.css';
import YourNotes from './YourNotes';
import StudyRoom from './StudyRoom';


function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    alert('Logged out');
  };

  return (
    <Router>
      <div>
        {/* Header shown on all pages */}
        <div className="app-header">
          <Link to="/" className="app-title-link">
            <h2 className="app-title">📘 StudyMate</h2>
          </Link>
          <div className="user-section">
            {userEmail ? (
              <>
                <Link to="/your-notes" className="notes-link">
                  📁 Your Notes
                </Link>

                <span>{userEmail}</span>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <Link to="/login" className="notes-link">Login</Link>
            )}
          </div>
        </div>

        {/* App Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pdf" element={<PDFWithNotes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/your-notes" element={<YourNotes />} />
          <Route path="/studyroom/:sessionId" element={<StudyRoom />} />
       


        </Routes>
      </div>
    </Router>
  );
}

export default App;
