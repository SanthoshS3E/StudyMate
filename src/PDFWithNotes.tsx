import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from './firebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import './styles.css';

function PDFWithNotes() {
  const location = useLocation();
  const { pdfUrl, sessionId } = location.state || {};
  const [pageNumber, setPageNumber] = useState(1);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const addedGuestCandidates = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, 'studySessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      // ✅ Sync page number & notes
      if (typeof data.pageNumber === 'number') setPageNumber(data.pageNumber);
      const newNotes = data.notes || {};
      if (JSON.stringify(newNotes) !== JSON.stringify(notes)) {
        setNotes({ ...newNotes });
      }

      // ✅ WebRTC signaling
      if (
        peerConnection.current &&
        data.signaling?.answer &&
        !peerConnection.current.remoteDescription
      ) {
        await peerConnection.current.setRemoteDescription({
          type: 'answer',
          sdp: data.signaling.answer,
        });
        console.log('✅ Host set remote description from guest answer');
      }

      if (peerConnection.current?.remoteDescription && data.signaling?.guestCandidates) {
        for (const candidate of data.signaling?.guestCandidates) {
          const key = JSON.stringify(candidate);
          if (!addedGuestCandidates.current.has(key)) {
            try {
              console.log('📡 Host adding guest ICE candidate:', candidate);
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
              addedGuestCandidates.current.add(key);
            } catch (err) {
              console.warn('⚠️ Error adding guest ICE candidate:', err);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, notes]);

  const updateSession = async (updates: Partial<any>) => {
    if (!sessionId) return;
    const sessionRef = doc(db, 'studySessions', sessionId);
    await updateDoc(sessionRef, updates);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedNotes = { ...notes, [pageNumber]: e.target.value };
    setNotes(updatedNotes);
    if (sessionId) updateSession({ notes: updatedNotes });
  };

  const goToPage = (delta: number) => {
    const newPage = Math.max(1, pageNumber + delta);
    setPageNumber(newPage);
    if (sessionId) updateSession({ pageNumber: newPage });
  };

  const handleSave = () => {
    updateSession({ notes });
    alert('✅ Notes saved!');
  };

  const handleInvite = () => {
    const inviteLink = `${window.location.origin}/studyroom/${sessionId}`;
    navigator.clipboard.writeText(inviteLink);
    alert('📨 Invite link copied to clipboard!');
  };

  const handleToggleVoice = async () => {
    setIsVoiceOn((prev) => !prev);
    if (!isVoiceOn) {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnection.current = pc;
      console.log('✅ Host peer connection created');

      localStream.current.getTracks().forEach((track) =>
        pc.addTrack(track, localStream.current!)
      );

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('📡 Host ICE candidate:', event.candidate);
          const sessionRef = doc(db, 'studySessions', sessionId);
          await updateDoc(sessionRef, {
            'signaling.hostCandidates': arrayUnion(event.candidate.toJSON()),
          });
        }
      };

      pc.ontrack = (event) => {
        console.log('✅ Host received remote track:', event);

        const remoteStream = event.streams?.[0] || new MediaStream([event.track]);
        const remoteAudio = new Audio();
        remoteAudio.srcObject = remoteStream;

        remoteAudio
          .play()
          .then(() => console.log('🔊 Host is playing remote audio'))
          .catch((err) => console.error('🔇 Host playback failed:', err));
      };

      const offer = await pc.createOffer();
      console.log('📡 Host created offer:', offer);

      await pc.setLocalDescription(offer);
      await updateSession({
        signaling: { offer: offer.sdp, hostCandidates: [] },
      });

      alert('🎤 Voice started. Guest can now join.');
    } else {
      console.log('🛑 Host ending voice');
      peerConnection.current?.close();
      localStream.current?.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="pdf-viewer-wrapper">
      {/* ✅ Session Header without Whiteboard */}
      <div className="session-header">
        <h2>📄 Study Session</h2>
        <div className="header-actions">
          <button onClick={handleInvite}>🤝 Invite</button>
          <button onClick={handleToggleVoice}>
            {isVoiceOn ? '🔇 End Voice' : '🎤 Join Voice'}
          </button>
        </div>
      </div>

      {/* ✅ PDF + Notes container */}
      <div className="viewer-container">
        {/* PDF Viewer */}
        <div className="pdf-side">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              pdfUrl
            )}&embedded=true`}
            title="PDF Viewer"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
          <div
            className="page-controls"
            style={{ right: '10px', left: 'auto' }}
          >
            <button onClick={() => goToPage(-1)}>Previous</button>
            <span>Page {pageNumber}</span>
            <button onClick={() => goToPage(1)}>Next</button>
          </div>
        </div>

        {/* Notes Panel */}
        <div className="notes-side">
          <h3>Notes - Page {pageNumber}</h3>
          <textarea
            rows={20}
            value={notes[pageNumber] || ''}
            onChange={handleNoteChange}
            placeholder="Type your notes here..."
          />
          <div className="button-row">
            <button onClick={handleSave}>💾 Save Notes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFWithNotes;
