// ✅ StudyRoom.tsx — Guest: voice + ICE + mute toggle
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './firebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import './styles.css';

function StudyRoom() {
  const { sessionId } = useParams();
  const [pdfUrl, setPdfUrl] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [isMuted, setIsMuted] = useState(false);
  const addedHostCandidates = useRef<Set<string>>(new Set());
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, 'studySessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      setPdfUrl(data.pdfUrl);
      if (typeof data.pageNumber === 'number') setPageNumber(data.pageNumber);
      if (data.notes) setNotes(data.notes);

      // Apply host ICE candidates
      if (peerConnection.current && data.signaling?.hostCandidates) {
        for (const candidate of data.signaling.hostCandidates) {
          const key = JSON.stringify(candidate);
          if (!addedHostCandidates.current.has(key)) {
            try {
              console.log("📡 Guest adding host ICE candidate:", candidate);
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
              addedHostCandidates.current.add(key);
            } catch (err) {
              console.warn('⚠️ Error adding host ICE candidate:', err);
            }
          }
        }
      }

      // Receive offer and respond
      if (data.signaling?.offer && !peerConnection.current) {
        localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });

        // ✅ Add STUN server config
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnection.current = pc;
        console.log("✅ Guest peer connection created");

        localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current!));

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            console.log("📡 Guest ICE candidate:", event.candidate);
            await updateDoc(sessionRef, {
              'signaling.guestCandidates': arrayUnion(event.candidate.toJSON())
            });
          }
        };

        // ✅ Safe ontrack handler
        pc.ontrack = (event) => {
          console.log("✅ Guest received remote track:", event);

          const remoteStream = event.streams?.[0] || new MediaStream([event.track]);
          if (!remoteAudioRef.current) {
            remoteAudioRef.current = new Audio();
          }
          remoteAudioRef.current.srcObject = remoteStream;

          remoteAudioRef.current.play()
            .then(() => console.log("🔊 Guest is playing remote audio"))
            .catch((err) => console.error("🔇 Guest playback failed:", err));
        };

        await pc.setRemoteDescription({ type: 'offer', sdp: data.signaling.offer });
        console.log("✅ Guest set remote description from host offer");

        const answer = await pc.createAnswer();
        console.log("📡 Guest created answer:", answer);

        await pc.setLocalDescription(answer);
        await updateDoc(sessionRef, { 'signaling.answer': answer.sdp });
        console.log("✅ Guest set local description & pushed answer to Firestore");
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updated = { ...notes, [pageNumber]: e.target.value };
    setNotes(updated);
    const sessionRef = doc(db, 'studySessions', sessionId!);
    updateDoc(sessionRef, { notes: updated });
  };

  const goToPage = (delta: number) => {
    const newPage = Math.max(1, pageNumber + delta);
    setPageNumber(newPage);
    const sessionRef = doc(db, 'studySessions', sessionId!);
    updateDoc(sessionRef, { pageNumber: newPage });
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => (track.enabled = !isMuted));
    }
  };

  return (
    <div className="pdf-viewer-wrapper">
      <div className="viewer-container">
        <div className="pdf-side">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
            title="Shared PDF"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
          <div className="page-controls" style={{ right: '10px', left: 'auto' }}>
            <button onClick={() => goToPage(-1)}>Previous</button>
            <span>Page {pageNumber}</span>
            <button onClick={() => goToPage(1)}>Next</button>
          </div>
        </div>

        <div className="notes-side">
          <h3>Shared Notes - Page {pageNumber}</h3>
          <textarea
            rows={20}
            value={notes[pageNumber] || ''}
            onChange={handleNoteChange}
            placeholder="Write shared notes here..."
          />
          <div className="button-row">
            <button onClick={toggleMute}>{isMuted ? '🎙 Unmute' : '🔇 Mute'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyRoom;
