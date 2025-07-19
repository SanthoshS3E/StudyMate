import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

function Home() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<{ file: File | null; url: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFileInfo({ file: selected, url: URL.createObjectURL(selected) });
  };

  const handleStartSession = async () => {
    if (!fileInfo?.file) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError('Please log in to use StudyMate.');
      return;
    }

    const fileName = fileInfo.file.name;
    const sessionId = uuidv4();

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `pdfs/${user.uid}/${fileName}`);
      await uploadBytes(storageRef, fileInfo.file);
      const downloadURL = await getDownloadURL(storageRef);

     await setDoc(doc(db, 'studySessions', sessionId), {
  fileName,
  pdfUrl: downloadURL,
  notes: {},            // placeholder for notes
  pageNumber: 1,
  createdAt: new Date(),
  signaling: {},
  createdBy: {
    uid: user.uid,
    email: user.email
  }
});


      navigate('/pdf', {
        state: { pdfUrl: downloadURL, fileName, sessionId },
      });
    } catch (err) {
      console.error('Upload failed', err);
      setError('Failed to upload PDF or create session.');
    }
  };

  return (
    <>
      {/* ✅ Hero Section */}
      <div className="hero-section">
        <div className="hero-box">
          <h1 className="hero-title">📘 Study Mate</h1>
          <p className="hero-subtitle">Study smarter with PDFs, notes, and real-time collaboration</p>

          {/* File Upload */}
          <label htmlFor="file-upload" className="hero-upload-button">Choose PDF File</label>
          <input
            id="file-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            onClick={handleStartSession}
            className="start-button"
            disabled={!fileInfo?.file}
            style={{
              margin: '15px 5px',
              padding: '12px 24px',
              borderRadius: '8px',
              background: fileInfo?.file ? '#2563eb' : '#9ca3af',
              color: 'white',
              fontWeight: 600,
              cursor: fileInfo?.file ? 'pointer' : 'not-allowed',
              border: 'none'
            }}
          >
            🚀 Start Session
          </button>

          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      {/* ✅ Features Section BELOW hero */}
      <div className="features-section">
        <h2>✨ What you can do with StudyMate</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📄 Upload & Share PDFs</h3>
            <p>Upload study materials and share them instantly with your friends.</p>
          </div>
          <div className="feature-card">
            <h3>📝 Real-time Notes</h3>
            <p>Take collaborative notes while reading the same PDF together.</p>
          </div>
          <div className="feature-card">
            <h3>🎤 Built-in Voice Chat</h3>
            <p>Talk to your study partners directly without any extra apps.</p>
          </div>
          
        </div>
      </div>

      {/* ✅ Contact Section at Bottom */}
      <div className="contact-section">
        <h2>📬 Contact Us</h2>
        <p>Have questions or feedback?</p>
        <p>
          Email:{" "}
          <a href="mailto:support@studymate.com" style={{ color: 'white', textDecoration: 'underline' }}>
            santhoshshekar2004@gmail.com
          </a>
        </p>
      </div>
    </>
  );
}

export default Home;
