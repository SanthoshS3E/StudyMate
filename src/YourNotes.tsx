import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './styles.css';

function YourNotes() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      const q = query(
        collection(db, 'studySessions'),
        where('createdBy.uid', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSessions(data);
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  const openSession = (session: any) => {
    navigate('/pdf', {
      state: {
        pdfUrl: session.pdfUrl,
        fileName: session.fileName,
        sessionId: session.id
      }
    });
  };

  if (loading) {
    return <p style={{ padding: "30px" }}>Loading your sessions...</p>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h2>Your Study Sessions</h2>

      {sessions.length === 0 ? (
        <p>You haven't created any sessions yet.</p>
      ) : (
        <div className="sessions-grid">
          {sessions.map((session) => (
            <div key={session.id} className="session-card">
              <h3>📄 {session.fileName}</h3>
              <p>
                Created:{" "}
                {session.createdAt?.seconds
                  ? new Date(session.createdAt.seconds * 1000).toLocaleString()
                  : "N/A"}
              </p>
              <button
                className="open-session-btn"
                onClick={() => openSession(session)}
              >
                Open Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YourNotes;
