import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Phone, Video, Users, AlertCircle, CheckCircle, CheckCircle2, ShieldCheck, X,
  Mic, MicOff, VideoOff, PhoneOff, RefreshCw, Star, ArrowRight, BrainCircuit, HeartHandshake, HelpCircle, Activity,
  Clock, User, CreditCard
} from 'lucide-react';
import { API_BASE } from '../App.jsx';
import doctorConsultationImg from '../assets/doctor-consultation.jpg';
import telehealthVideoImg from '../assets/telehealth-video.jpg';

const SAARTHI_DEMO_CONSULTATION_AMOUNT = 500;

const readApiErrorMessage = async (response, fallback) => {
  try {
    const body = await response.json();
    return body.message || fallback;
  } catch {
    return fallback;
  }
};

const formatAppointmentForCache = (appointment) => ({
  id: appointment.appointmentRef || `APT-${appointment.id}`,
  appointmentId: appointment.id,
  appointmentRef: appointment.appointmentRef,
  doctorName: appointment.doctorName,
  speciality: appointment.specialty,
  timing: appointment.timeSlot,
  fee: appointment.fee,
  status: appointment.status,
  date: appointment.date
});

function GynConnect({ isLoggedIn, onRequireAuth, onNavigateTab }) {
  const [activeSection, setActiveSection] = useState('onboarding'); // 'onboarding', 'nearby', 'consult'
  const [selectedSpecialty, setSelectedSpecialty] = useState(''); // 'gyno', 'maternity', 'psychologist'
  const [selectedMode, setSelectedMode] = useState(''); // 'video', 'visit'
  
  const [doctors, setDoctors] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Bhopal, MP'); // Default location
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [doctorResultSource, setDoctorResultSource] = useState('');
  const [doctorResultNotice, setDoctorResultNotice] = useState('');
  const [appointmentSaved, setAppointmentSaved] = useState(false);
  const [bookingNotice, setBookingNotice] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [hoveredDoctorId, setHoveredDoctorId] = useState(null);
  const [selectedMapDoctor, setSelectedMapDoctor] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isScanningLocation, setIsScanningLocation] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [locationToast, setLocationToast] = useState('');

  const getCityCoordinates = (cityStr) => {
    const norm = (cityStr || '').toLowerCase();
    if (norm.includes('kota')) {
      return { lat: 25.2138, lng: 75.8648, bbox: '75.8000,25.1500,75.9200,25.2800' };
    } else if (norm.includes('bhopal')) {
      return { lat: 23.2599, lng: 77.4126, bbox: '77.3500,23.2000,77.4800,23.3200' };
    } else if (norm.includes('indore')) {
      return { lat: 22.7196, lng: 75.8577, bbox: '75.8000,22.6500,75.9200,22.7800' };
    } else if (norm.includes('jaipur')) {
      return { lat: 26.9124, lng: 75.7873, bbox: '75.7200,26.8500,75.8500,26.9800' };
    } else if (norm.includes('delhi')) {
      return { lat: 28.6139, lng: 77.2090, bbox: '77.1500,28.5500,77.2800,28.6800' };
    } else if (norm.includes('mumbai')) {
      return { lat: 19.0760, lng: 72.8777, bbox: '72.8000,19.0000,72.9500,19.1500' };
    }
    // Default Gwalior
    return { lat: 26.2183, lng: 78.1828, bbox: '78.1000,26.1500,78.2500,26.2800' };
  };

  // WebRTC & Call states
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState('Enter an online-video appointment reference to join the demo call.');

  // Post-Consultation Rating Modal States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Check URL query parameters for Stripe payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setBookingNotice('Returned from Stripe Checkout. Payment verification is still pending.');
      // Remove query parameters from URL for clean display
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [paymentModalData, setPaymentModalData] = useState(null);
  const [paymentTab, setPaymentTab] = useState('upi'); // 'upi' or 'stripe'

  const handleDoctorPayment = (doctor, amount) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    setPaymentModalData({ providerId: doctor.providerId, doctorName: doctor.name, amount });
    setAppointmentSaved(false);
    setBookingNotice('');
    setBookingError('');
    setPaymentTab('upi');
  };

  const handleConfirmPayment = async (method) => {
    const matchedDoc = doctors.find(d => d.providerId === paymentModalData.providerId);
    const docName = paymentModalData.doctorName;
    const docSpec = matchedDoc?.speciality || matchedDoc?.searchCategory || 'Healthcare provider';
    const clinic = matchedDoc?.address || matchedDoc?.name || 'OpenStreetMap provider';
    const feeAmt = paymentModalData.amount;
    const dateStr = new Date().toISOString().slice(0, 10);
    const token = localStorage.getItem('saarthi_token');

    if (!token || !isLoggedIn) {
      setBookingError('Please sign in before creating an appointment.');
      onRequireAuth();
      return;
    }

    setBookingError('');
    setBookingNotice('Saving the appointment...');

    let savedAppointment;
    try {
      const appointmentResponse = await fetch(`${API_BASE}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          providerId: matchedDoc?.providerId,
          doctorName: docName,
          specialty: docSpec,
          clinicName: clinic,
          date: dateStr,
          timeSlot: 'Demo scheduling pending',
          mode: selectedMode === 'visit' ? 'Visit Doctor Nearby' : 'Online Video Call'
        })
      });

      if (!appointmentResponse.ok) {
        if (appointmentResponse.status === 401 || appointmentResponse.status === 403) {
          throw new Error('Your session is not authorized. Please sign in again.');
        }
        throw new Error(await readApiErrorMessage(
          appointmentResponse,
          `Appointment could not be saved (${appointmentResponse.status}).`
        ));
      }

      savedAppointment = await appointmentResponse.json();
    } catch (error) {
      setBookingNotice('');
      setBookingError(error.message || 'The appointment could not be saved. Please try again.');
      setPaymentModalData(null);
      return;
    }

    // localStorage is only a cache of the canonical response returned by PostgreSQL.
    try {
      const cached = JSON.parse(localStorage.getItem('saarthi_appointments') || '[]');
      const formatted = formatAppointmentForCache(savedAppointment);
      const withoutDuplicate = cached.filter(a => a.appointmentRef !== savedAppointment.appointmentRef);
      localStorage.setItem('saarthi_appointments', JSON.stringify([formatted, ...withoutDuplicate]));
    } catch (error) {
      console.warn('Appointment was saved, but its browser cache could not be updated:', error);
    }

    setBookingNotice(`Appointment ${savedAppointment.appointmentRef} saved as pending payment.`);
    if (selectedMode === 'video') {
      setRoomId(savedAppointment.appointmentRef);
    }

    // Stripe starts only after PostgreSQL has returned the canonical appointment.
    if (method === 'stripe' || method === 'stripe_inapp' || method === 'stripe_external') {
      try {
        const response = await fetch(`${API_BASE}/payment/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ appointmentRef: savedAppointment.appointmentRef })
        });

        if (!response.ok) {
          throw new Error(await readApiErrorMessage(
            response,
            `Stripe Checkout could not be created (${response.status}).`
          ));
        }
        const data = await response.json();
        if (!data.checkoutUrl) {
          throw new Error('Stripe did not return a checkout URL.');
        }
        window.location.href = data.checkoutUrl;
        return;
      } catch (error) {
        setBookingNotice('');
        setBookingError(`Appointment ${savedAppointment.appointmentRef} remains pending, but checkout failed. ${error.message}`);
        setPaymentModalData(null);
        return;
      }
    }

    setAppointmentSaved(true);
    setBookingNotice(`Appointment ${savedAppointment.appointmentRef} is saved. UPI payment is not verified and remains pending.`);
    setTimeout(() => {
      setAppointmentSaved(false);
      setPaymentModalData(null);
      setActiveSection('consult');
    }, 2500);
  };

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const offerCreatedRef = useRef(false);

  const filterDoctorsList = async (city, customCoords) => {
    let specialtyKey = 'gyno';
    if (selectedSpecialty === 'maternity') specialtyKey = 'maternity';
    if (selectedSpecialty === 'psychologist') specialtyKey = 'psychologist';

    const specialtyLabel = specialtyKey === 'maternity'
      ? 'Maternity provider'
      : specialtyKey === 'psychologist'
        ? 'Perinatal psychologist'
        : 'Gynecologist';

    setDoctors([]);
    setDoctorResultSource('loading');
    setDoctorResultNotice('Searching OpenStreetMap for nearby healthcare providers...');

    // Prefer coordinates supplied by the current GPS callback. React state may still
    // contain the previous location immediately after setLocation runs.
    const cityCoordinates = getCityCoordinates(city);
    const latitude = customCoords?.lat ?? location?.lat ?? cityCoordinates.lat;
    const longitude = customCoords?.lng ?? location?.lng ?? cityCoordinates.lng;
    const token = localStorage.getItem('saarthi_token');

    if (!token) {
      setErrorMsg('Your session is missing. Please sign in again to search the doctor catalogue.');
      setDoctorResultSource('error');
      setDoctorResultNotice('Provider search was not attempted because authentication is required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/gynecologists?lat=${latitude}&lng=${longitude}&radius_km=25&specialty=${encodeURIComponent(specialtyKey)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('AUTHENTICATION_REQUIRED');
        }
        throw new Error(await readApiErrorMessage(
          res,
          `Nearby provider search failed (${res.status}).`
        ));
      }

      const backendDocs = await res.json();
      if (!Array.isArray(backendDocs)) {
        throw new Error('INVALID_DOCTOR_RESPONSE');
      }

      if (backendDocs.length > 0) {
        const mapped = backendDocs.map(d => ({
          id: d.providerId,
          providerId: d.providerId,
          name: d.name,
          address: d.address,
          latitude: d.latitude,
          longitude: d.longitude,
          distance: d.distanceKm,
          providerType: d.providerType,
          speciality: d.specialty,
          phone: d.phone,
          website: d.website?.startsWith('http://') || d.website?.startsWith('https://') ? d.website : null,
          osmUrl: d.osmUrl,
          searchCategory: specialtyLabel
        }));
        setDoctors(mapped);
        setDoctorResultSource('osm');
        setDoctorResultNotice('Nearby healthcare records from OpenStreetMap. Listings are community-maintained and not Saarthi-verified.');
      } else {
        setDoctorResultSource('empty');
        setDoctorResultNotice('OpenStreetMap returned no matching providers within 25 km.');
      }
    } catch (e) {
      console.warn("OpenStreetMap provider search failed: ", e);
      setDoctors([]);
      setDoctorResultSource('error');
      if (e.message === 'AUTHENTICATION_REQUIRED') {
        setErrorMsg('Your session could not be authenticated. Please sign in again.');
        setDoctorResultNotice('OpenStreetMap results are unavailable because backend authentication failed.');
      } else {
        setErrorMsg(e.message || 'The nearby provider search is currently unavailable.');
        setDoctorResultNotice('No provider cards are shown because the OpenStreetMap search failed.');
      }
    }
  };

  useEffect(() => {
    // Read local city if user is logged in
    const savedUser = localStorage.getItem('saarthi_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.location) {
        setLocationName(parsed.location);
      }
    }

    // Fetch User Appointments directly from Spring Boot Database Table (`appointments`)
    const fetchDbAppointments = async () => {
      const token = localStorage.getItem('saarthi_token');
      if (token && isLoggedIn) {
        try {
          const res = await fetch(`${API_BASE}/appointments/my`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const dbAppts = await res.json();
            if (Array.isArray(dbAppts)) {
              const formatted = dbAppts.map(formatAppointmentForCache);
              localStorage.setItem('saarthi_appointments', JSON.stringify(formatted));
            }
          }
        } catch (e) {
          console.warn("Appointment DB restore notice: ", e);
        }
      }
    };
    fetchDbAppointments();
  }, [isLoggedIn]);

  // Fetch coordinates and search doctors
  const handleUseLocation = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    triggerGPSScanFlow();
  };

  // Attach real local camera stream to video element when in call
  useEffect(() => {
    if (inCall && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => console.log("Camera video play notice:", err));
    }
  }, [inCall, localStream]);

  const sendSignal = (type, payload = {}) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type, callId: roomId.trim().toUpperCase(), payload }));
    return true;
  };

  const createPeerConnection = (stream) => {
    if (!stream || peerConnectionRef.current) return peerConnectionRef.current;
    const pcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(pcConfig);
    peerConnectionRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle incoming remote tracks from Doctor / Peer
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(incomingStream);
      setCallStatus('Demo peer connected. Media is flowing through WebRTC.');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = incomingStream;
      }
    };

    // Send local ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal('ICE_CANDIDATE', event.candidate.toJSON());
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setCallStatus('The peer connection failed. End the call and try again, preferably on a less restrictive network.');
      } else if (pc.connectionState === 'disconnected') {
        setCallStatus('The demo peer disconnected. Waiting briefly for the connection to recover.');
      } else if (pc.connectionState === 'connected') {
        setCallStatus('Demo peer connected. Media is flowing through WebRTC.');
      }
    };
    return pc;
  };

  const createAndSendOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || offerCreatedRef.current) return;
    offerCreatedRef.current = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal('OFFER', pc.localDescription.toJSON());
      setCallStatus('Connection offer sent. Waiting for the demo peer to answer.');
    } catch (error) {
      offerCreatedRef.current = false;
      setCallStatus('Could not create the WebRTC offer. End the call and try again.');
    }
  };

  const flushPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc?.remoteDescription) return;
    const candidates = pendingIceCandidatesRef.current.splice(0);
    for (const candidate of candidates) {
      await pc.addIceCandidate(candidate);
    }
  };

  const handleOffer = async (offer) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIceCandidates();
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      sendSignal('ANSWER', peerConnectionRef.current.localDescription.toJSON());
      setCallStatus('Connection answer sent. Establishing the peer-to-peer media path...');
    } catch (e) {
      setCallStatus('The received WebRTC offer could not be processed.');
    }
  };

  const handleAnswer = async (answer) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingIceCandidates();
      setCallStatus('Answer received. Establishing the peer-to-peer media path...');
    } catch (e) {
      setCallStatus('The received WebRTC answer could not be processed.');
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (!peerConnectionRef.current) return;
    try {
      const iceCandidate = new RTCIceCandidate(candidate);
      if (!peerConnectionRef.current.remoteDescription) {
        pendingIceCandidatesRef.current.push(iceCandidate);
        return;
      }
      await peerConnectionRef.current.addIceCandidate(iceCandidate);
    } catch (e) {
      setCallStatus('A network candidate could not be applied. The call may still connect using another candidate.');
    }
  };

  const cleanupCall = (notifyPeer = true) => {
    if (notifyPeer) sendSignal('LEAVE');
    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingIceCandidatesRef.current = [];
    offerCreatedRef.current = false;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    setInCall(false);
    setMicEnabled(true);
    setVideoEnabled(true);
  };

  const setupWebSocketSignaling = (stream, token) => {
    const envWsUrl = import.meta.env.VITE_WS_SIGNALING_URL;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host || 'localhost:5173';
    const wsUrl = envWsUrl || `${wsProtocol}//${wsHost}/ws/signaling`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      createPeerConnection(stream);
      setCallStatus('Authenticating and joining the appointment room...');
      sendSignal('JOIN', { token });
    };
    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.callId && data.callId !== roomId.trim().toUpperCase()) return;
        switch (data.type) {
          case 'JOINED':
            setCallStatus(data.payload?.peerCount === 2
              ? 'Joined. Waiting for the first participant to create the offer...'
              : 'Joined securely. Waiting for a second authenticated demo session...');
            break;
          case 'PEER_READY':
            await createAndSendOffer();
            break;
          case 'OFFER':
            await handleOffer(data.payload);
            break;
          case 'ANSWER':
            await handleAnswer(data.payload);
            break;
          case 'ICE_CANDIDATE':
            await handleIceCandidate(data.payload);
            break;
          case 'PEER_LEFT':
            setRemoteStream(null);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setCallStatus('The other demo session left the call.');
            break;
          case 'ERROR':
            setErrorMsg(data.payload?.message || 'The signaling server rejected the request.');
            setCallStatus('Unable to join the consultation room.');
            cleanupCall(false);
            break;
          default:
            break;
        }
      } catch (e) {
        setCallStatus('A signaling message could not be processed safely.');
      }
    };
    socket.onerror = () => {
      setErrorMsg('The video signaling server is unavailable. Please try again later.');
      setCallStatus('Signaling connection failed.');
      cleanupCall(false);
    };
    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
        setCallStatus('Signaling connection closed. End the call before trying again.');
      }
    };
  };

  const startVideoCall = async () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    const token = localStorage.getItem('saarthi_token');
    const normalizedCallId = roomId.trim().toUpperCase();
    if (!token) {
      setErrorMsg('Your login session is missing. Please sign in again.');
      return;
    }
    if (!/^APT-[A-Z0-9]{8}$/.test(normalizedCallId)) {
      setErrorMsg('Enter a valid online-video appointment reference, for example APT-12AB34CD.');
      return;
    }
    setRoomId(normalizedCallId);
    setErrorMsg('');
    setCallStatus('Requesting camera and microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setInCall(true);
      setupWebSocketSignaling(stream, token);
    } catch (error) {
      const permissionDenied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      const deviceMissing = error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError';
      setErrorMsg(permissionDenied
        ? 'Camera or microphone permission was denied. Allow both permissions and try again.'
        : deviceMissing
          ? 'No usable camera or microphone was found on this device.'
          : 'Camera or microphone access failed. Check the device and browser settings, then try again.');
      setCallStatus('Media access failed.');
    }
  };

  const endVideoCall = () => {
    cleanupCall(true);

    setShowRatingModal(true);
    setRatingStars(5);
    setSelectedBadges([]);
    setReviewText('');
    setRatingSubmitted(false);
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  useEffect(() => () => cleanupCall(false), []);

  const triggerGPSScanFlow = () => {
    setShowLocationModal(false);
    setIsScanningLocation(true);
    setScanProgress(0);
    setScanStatusText('📡 Initializing geospatial scanner...');
    setLoadingLoc(true);
    setErrorMsg('');

    // Call geolocation API to scan coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const freshCoordinates = { lat: latitude, lng: longitude };
          setLocation(freshCoordinates);
          let detectedCity = locationName;

          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (!res.ok) {
              throw new Error(`REVERSE_GEOCODING_FAILED_${res.status}`);
            }
            const geoData = await res.json();
            if (geoData.city) {
              detectedCity = geoData.city;
              setLocationName(geoData.city);
            }
          } catch (err) {
            console.warn('Reverse geocoding failed; searching with GPS coordinates:', err);
            setErrorMsg('GPS coordinates were found, but the city name could not be refreshed. The search still uses your GPS coordinates.');
          } finally {
            await filterDoctorsList(detectedCity, freshCoordinates);
            setLoadingLoc(false);
          }
        },
        (error) => {
          console.warn('Browser geolocation failed:', error);
          setLoadingLoc(false);
          setErrorMsg('GPS access failed or was denied. Searching from your saved city instead.');
          filterDoctorsList(locationName, getCityCoordinates(locationName));
        }
      );
    } else {
      setLoadingLoc(false);
      setErrorMsg('This browser does not support geolocation. Searching from your saved city instead.');
      filterDoctorsList(locationName, getCityCoordinates(locationName));
    }

    // Start 3.5 seconds progression animation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress > 100) {
        currentProgress = 100;
      }
      setScanProgress(currentProgress);

      if (currentProgress < 35) {
        setScanStatusText('📡 Scanning your GPS coordinates...');
      } else if (currentProgress < 75) {
        setScanStatusText('📍 Detecting address and location details...');
      } else if (currentProgress < 100) {
        setScanStatusText('🔍 Searching nearby OpenStreetMap healthcare records...');
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanningLocation(false);
          setActiveSection('nearby');
        }, 500);
      }
    }, 175); // 175ms * 20 steps = 3500ms (3.5 seconds)
  };

  // Submit onboarding selections to start matched search
  const handleOnboardingSubmit = () => {
    if (!selectedSpecialty || !selectedMode) {
      alert("Please select both a specialty and a consultation mode.");
      return;
    }

    if (selectedMode === 'video') {
      setActiveSection('consult');
    } else {
      // Wait for GPS or an explicit saved-city choice so an older request
      // cannot race with and overwrite the fresh GPS-based result.
      setShowLocationModal(true);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* GPS Location Authorization Request Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-warm-150 space-y-6 animate-in zoom-in-95 duration-250 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
              📍
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-warm-850">GPS Location Access Required</h3>
              <p className="text-sm font-semibold text-warm-500 leading-relaxed">
                Saarthi GynConnect uses GPS coordinates to search nearby community-maintained OpenStreetMap healthcare records.
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => {
                  setShowLocationModal(false);
                  filterDoctorsList(locationName, getCityCoordinates(locationName));
                  setActiveSection('nearby');
                }}
                className="flex-1 py-3 bg-warm-100 hover:bg-warm-150 text-warm-700 font-extrabold rounded-xl transition-all text-sm cursor-pointer border border-warm-200"
              >
                Use Saved City
              </button>
              <button 
                onClick={triggerGPSScanFlow}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md text-sm cursor-pointer"
              >
                Scan My GPS Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geospatial Scanner Loading Progress Bar Modal */}
      {isScanningLocation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-warm-150 space-y-8 animate-in zoom-in-95 duration-250 text-center">
            
            {/* Radar Pulsing Animation */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100/30 border border-emerald-500/10 animate-ping"></div>
              <div className="absolute w-16 h-16 rounded-full bg-emerald-100/60 border border-emerald-500/20 animate-pulse"></div>
              <div className="relative w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-md">
                📡
              </div>
            </div>

            {/* Status updates */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-lg font-black text-warm-850">Geospatial Scanner Active</h4>
                <p className="text-sm font-semibold text-emerald-600 animate-pulse min-h-[20px]">{scanStatusText}</p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-2">
                <div className="w-full bg-warm-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-warm-200">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-warm-450 px-1">
                  <span>Searching Grid</span>
                  <span>{scanProgress}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      
      {/* Header Banner Card with Real Image */}
      <div className="bg-white border border-[#ECE8F5] rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs text-left">
        <div className="space-y-2 max-w-xl">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#3B826E] bg-[#A9D8C8]/20 px-3 py-1 rounded-full border border-[#A9D8C8]/30">
            🩺 OpenStreetMap Discovery & Demo Telehealth
          </span>
          <h2 className="font-outfit text-2xl sm:text-3xl font-black text-[#2D2A4A]">GynConnect Telehealth</h2>
          <p className="text-xs sm:text-sm text-[#5F6473] leading-relaxed">
            Explore nearby healthcare records returned through OpenStreetMap's Overpass service.
          </p>
          {activeSection !== 'onboarding' && (
            <button 
              onClick={() => {
                endVideoCall();
                setActiveSection('onboarding');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-[#6D5BD0] text-[#2D2A4A] bg-white hover:bg-[#F5F3FA] transition-colors cursor-pointer"
            >
              ← Reset Search Criteria
            </button>
          )}
        </div>
        <img 
          src={doctorConsultationImg} 
          alt="GynConnect Consultation" 
          className="w-full md:w-72 h-44 object-cover rounded-2xl border border-[#ECE8F5] shadow-xs"
        />
      </div>

      {appointmentSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex gap-2 items-center leading-relaxed text-left animate-in slide-in-from-top duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Appointment saved in Saarthi. Payment remains unverified, and the OpenStreetMap-listed provider does not receive it automatically.</span>
        </div>
      )}

      {bookingNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs font-bold text-left">
          {bookingNotice}
        </div>
      )}

      {bookingError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold text-left">
          {bookingError}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl text-xs flex gap-2 items-start leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 text-yellow-600 mt-0.5" />
          <p><strong>Status Info:</strong> {errorMsg}</p>
        </div>
      )}

      {/* 1. ONBOARDING PAGE - BIG CONFIGURATION BUTTONS */}
      {activeSection === 'onboarding' && (
        <div className="max-w-3xl mx-auto bg-white border border-[#ECE8F5] rounded-[24px] p-8 shadow-xs space-y-8 animate-in zoom-in-95 duration-200 text-left font-sans">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#B6A8F8]/15 text-[#6D5BD0] rounded-full flex items-center justify-center text-3xl mx-auto border border-[#B6A8F8]/30">🩺</div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#2D2A4A] font-outfit">Specify Your Consult Requirements</h3>
            <p className="text-xs sm:text-sm font-normal text-[#5F6473]">Select what type of care you need to search nearby OpenStreetMap records.</p>
          </div>

          {/* Specialty selections */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2D2A4A] block">STEP 1: WHICH SPECIALTY DO YOU NEED?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <button
                onClick={() => setSelectedSpecialty('gyno')}
                className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all cursor-pointer ${
                  selectedSpecialty === 'gyno' 
                    ? 'border-[#6D5BD0] bg-[#B6A8F8]/15 text-[#2D2A4A] ring-2 ring-[#6D5BD0]/20 shadow-xs' 
                    : 'border-[#ECE8F5] bg-white hover:bg-[#F5F3FA] text-[#2D2A4A]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white text-[#6D5BD0] flex items-center justify-center text-lg font-bold border border-[#ECE8F5]">🩺</div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#2D2A4A]">Gynecologist</h4>
                  <p className="text-xs font-normal text-[#5F6473] mt-1">General organ, cycle, and reproductive health checks.</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedSpecialty('maternity')}
                className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all cursor-pointer ${
                  selectedSpecialty === 'maternity' 
                    ? 'border-[#6D5BD0] bg-[#B6A8F8]/15 text-[#2D2A4A] ring-2 ring-[#6D5BD0]/20 shadow-xs' 
                    : 'border-[#ECE8F5] bg-white hover:bg-[#F5F3FA] text-[#2D2A4A]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white text-[#6D5BD0] flex items-center justify-center text-lg font-bold border border-[#ECE8F5]">🤰</div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#2D2A4A]">Maternity Specialist</h4>
                  <p className="text-xs font-normal text-[#5F6473] mt-1">Pregnancy tracking, prenatal care, and baby delivery.</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedSpecialty('psychologist')}
                className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all cursor-pointer ${
                  selectedSpecialty === 'psychologist' 
                    ? 'border-[#6D5BD0] bg-[#B6A8F8]/15 text-[#2D2A4A] ring-2 ring-[#6D5BD0]/20 shadow-xs' 
                    : 'border-[#ECE8F5] bg-white hover:bg-[#F5F3FA] text-[#2D2A4A]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white text-[#6D5BD0] flex items-center justify-center text-lg font-bold border border-[#ECE8F5]">🧠</div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#2D2A4A]">Maternity Psychologist</h4>
                  <p className="text-xs font-normal text-[#5F6473] mt-1">Postpartum depression support and mental health.</p>
                </div>
              </button>

            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2D2A4A] block">STEP 2: HOW WOULD YOU LIKE TO CONSULT?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <button
                onClick={() => setSelectedMode('video')}
                className={`p-6 rounded-2xl border text-left flex items-center gap-4 transition-all cursor-pointer ${
                  selectedMode === 'video' 
                    ? 'border-[#6D5BD0] bg-[#B6A8F8]/15 text-[#2D2A4A] ring-2 ring-[#6D5BD0]/20 shadow-xs' 
                    : 'border-[#ECE8F5] bg-white hover:bg-[#F5F3FA] text-[#2D2A4A]'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-white text-[#6D5BD0] flex items-center justify-center text-2xl font-bold border border-[#ECE8F5]">📹</div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#2D2A4A]">Online Video Call</h4>
                  <p className="text-xs font-normal text-[#5F6473] mt-0.5">Start virtual video consultations instantly from your home.</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode('visit')}
                className={`p-6 rounded-2xl border text-left flex items-center gap-4 transition-all cursor-pointer ${
                  selectedMode === 'visit' 
                    ? 'border-[#6D5BD0] bg-[#B6A8F8]/15 text-[#2D2A4A] ring-2 ring-[#6D5BD0]/20 shadow-xs' 
                    : 'border-[#ECE8F5] bg-white hover:bg-[#F5F3FA] text-[#2D2A4A]'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-white text-[#6D5BD0] flex items-center justify-center text-2xl font-bold border border-[#ECE8F5]">📍</div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#2D2A4A]">Visit Doctor Nearby</h4>
                  <p className="text-xs font-normal text-[#5F6473] mt-0.5">Locate clinical centers and doctors in your direct area.</p>
                </div>
              </button>

            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <button
              onClick={handleOnboardingSubmit}
              disabled={!selectedSpecialty || !selectedMode}
              className="w-full py-4 bg-[#6D5BD0] hover:bg-[#5b4ab9] disabled:opacity-40 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center justify-center gap-3 text-sm tracking-wide cursor-pointer"
            >
              <span>Search and Connect Doctor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* 2. NEARBY DOCTORS LIST VIEW */}
      {activeSection === 'nearby' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-teal-100/50">
            <h3 className="font-outfit text-sm font-extrabold text-teal-950 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Healthcare Provider Results near {locationName}</span>
            </h3>
            <button 
              onClick={handleUseLocation}
              disabled={loadingLoc}
              className="text-[10px] font-extrabold text-teal-700 hover:text-teal-900 transition-colors bg-teal-50 hover:bg-teal-100/60 px-2.5 py-1 rounded-md border border-teal-150/40"
            >
              {loadingLoc ? 'Updating Location...' : 'Change Location'}
            </button>
          </div>

          {doctorResultNotice && (
            <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
              doctorResultSource === 'osm'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : doctorResultSource === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              {doctorResultNotice}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-stretch">
            
            {/* Left Side: Doctor Cards List (Spans 5 columns) */}
            <div className="lg:col-span-5 space-y-5.5 max-h-[580px] overflow-y-auto pr-2.5">
              {doctors.map((doc) => {
                const isHovered = hoveredDoctorId === doc.id;
                const isSelectedOnMap = selectedMapDoctor?.id === doc.id;
                
                return (
                  <div 
                    key={doc.id} 
                    onMouseEnter={() => setHoveredDoctorId(doc.id)}
                    onMouseLeave={() => setHoveredDoctorId(null)}
                    className={`bg-white rounded-2xl border p-6 shadow-soft flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                      isHovered || isSelectedOnMap
                        ? 'border-teal-700 bg-teal-50/15 ring-1 ring-teal-700/20 shadow-md' 
                        : 'border-teal-100/70 hover:border-teal-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
                          <User className="w-4.5 h-4.5 text-teal-800" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wide text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full">
                          OSM record
                        </span>
                      </div>

                      <div>
                        <h4 className="font-outfit font-extrabold text-teal-950 text-sm">{doc.name}</h4>
                        {doc.providerType && (
                          <p className="text-[10px] text-teal-750 font-extrabold tracking-wide uppercase mt-0.5">
                            {doc.providerType.replaceAll('_', ' ')}
                          </p>
                        )}
                        {doc.speciality && (
                          <p className="text-[10px] text-[#5F6473] mt-1">
                            OSM specialty: {doc.speciality.replaceAll(';', ', ').replaceAll('_', ' ')}
                          </p>
                        )}
                        {doc.address && <p className="text-xs text-muted-foreground mt-1">{doc.address}</p>}
                        {doc.phone && <p className="text-[10px] text-[#5F6473] mt-1">Phone: {doc.phone}</p>}
                        {doc.website && (
                          <a href={doc.website} target="_blank" rel="noreferrer" className="text-[10px] text-[#6D5BD0] underline mt-1 inline-block">
                            Provider website
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-[#ECE8F5] pt-3.5 space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-medium text-[#5F6473]">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#6D5BD0]" /> Availability not provided</span>
                        <span className="font-bold text-[#3B826E] bg-[#A9D8C8]/20 px-2.5 py-0.5 rounded-full border border-[#A9D8C8]/30 flex items-center gap-1 text-[10px]">
                          <MapPin className="w-3 h-3 text-[#3B826E]" /> {doc.distance} km away
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDoctorPayment(doc, SAARTHI_DEMO_CONSULTATION_AMOUNT)}
                        className="w-full py-2.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl font-bold text-xs shadow-xs transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Book Saarthi Demo Consultation (₹{SAARTHI_DEMO_CONSULTATION_AMOUNT})</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMapDoctor(doc);
                        }}
                        className="w-full py-2 bg-white hover:bg-[#F5F3FA] text-[#2D2A4A] rounded-xl font-bold text-[11px] border border-[#6D5BD0] transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#6D5BD0]" />
                        <span>Show on OpenStreetMap</span>
                      </button>
                      {doc.osmUrl && (
                        <a
                          href={doc.osmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-center text-[10px] font-bold text-[#5F6473] hover:text-[#2D2A4A] underline"
                        >
                          Open exact OSM record
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Side: OpenStreetMap view (Spans 7 columns) */}
            <div className="lg:col-span-7 relative bg-white border border-[#ECE8F5] rounded-[24px] overflow-hidden min-h-[500px] shadow-xs flex flex-col justify-between">
              {(() => {
                const cityCoords = getCityCoordinates(locationName);
                const mapLat = selectedMapDoctor?.latitude ?? location?.lat ?? cityCoords.lat;
                const mapLng = selectedMapDoctor?.longitude ?? location?.lng ?? cityCoords.lng;
                const delta = 0.015;
                const bbox = `${mapLng - delta},${mapLat - delta},${mapLng + delta},${mapLat + delta}`;
                return (
                  <iframe
                    title={selectedMapDoctor ? `OpenStreetMap location for ${selectedMapDoctor.name}` : `OpenStreetMap centered on ${locationName}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '500px' }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapLat},${mapLng}`}
                    className="w-full h-full"
                  ></iframe>
                );
              })()}

              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs border border-[#ECE8F5] px-3 py-1.5 rounded-xl shadow-xs text-[10px] font-bold text-[#2D2A4A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B826E] animate-pulse"></span>
                <span>{selectedMapDoctor ? `Selected: ${selectedMapDoctor.name}` : `Map centered on ${locationName}`}</span>
                <span>•</span>
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
                  © OpenStreetMap contributors
                </a>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. WebRTC VIDEO CONSULTING ROOM */}
      {activeSection === 'consult' && (
        <div className="space-y-6">
          {!inCall ? (
            <div className="bg-white rounded-2xl border border-warm-200 p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
                📹
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-warm-800">WebRTC Consultation Demo</h3>
                <p className="text-sm text-warm-500 max-w-sm mx-auto leading-relaxed">
                  Enter an online-video appointment reference owned by your account. For the demo, sign in to a second browser session with the same account and join the same reference.
                </p>
              </div>

              <div className="flex gap-2 max-w-sm w-full">
                <input 
                  type="text" 
                  value={roomId} 
                  onChange={(e) => setRoomId(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  placeholder="Appointment reference (APT-...)"
                />
                <button 
                  onClick={startVideoCall}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-sm text-sm"
                >
                  Join Call
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-teal-100/60 shadow-soft text-left flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                  <div>
                    <p className="text-xs font-extrabold text-teal-950">WebRTC Demo Session • Call ID: {roomId}</p>
                    <p className="text-[10px] text-teal-700 font-semibold">{callStatus}</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-150/40">
                  Browser-managed WebRTC security
                </span>
              </div>

              {/* Responsive Medical Telehealth Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[360px]">
                
                {/* Doctor Video Stream Panel */}
                <div className="relative bg-teal-950 rounded-3xl overflow-hidden shadow-xl border border-teal-800 flex flex-col justify-between p-5 min-h-[300px]">
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="text-[10px] font-extrabold text-white bg-teal-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-teal-700/50 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Authenticated Demo Peer</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-teal-200 bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-md">
                      Remote media
                    </span>
                  </div>

                  {/* Doctor Clinical Visual Placeholder */}
                  {!remoteStream ? (
                    <div className="relative z-10 my-auto text-center space-y-3 py-10">
                      <RefreshCw className="w-8 h-8 text-teal-300 animate-spin mx-auto" />
                      <p className="text-xs font-extrabold text-teal-100">Waiting for remote WebRTC media...</p>
                    </div>
                  ) : null}

                  <div className="relative z-10 flex items-center justify-between text-[11px] text-teal-200 font-semibold pt-2 border-t border-teal-800/50">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Remote WebRTC media</span>
                    </span>
                    <span>Call {roomId}</span>
                  </div>
                </div>

                {/* Patient Stream Panel */}
                <div className="relative bg-teal-900 rounded-3xl overflow-hidden shadow-xl border border-teal-800 flex flex-col justify-between p-5 min-h-[300px]">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="text-[10px] font-extrabold text-white bg-teal-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-teal-700/50">
                      Patient Self-View
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-300 bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-md">
                      {micEnabled ? 'Mic On 🎤' : 'Muted 🔇'}
                    </span>
                  </div>

                  {!videoEnabled && (
                    <div className="relative z-10 my-auto text-center space-y-2 py-10">
                      <VideoOff className="w-10 h-10 text-teal-400 mx-auto" />
                      <p className="text-xs font-bold text-teal-200">Camera turned off</p>
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between text-[11px] text-teal-200 font-semibold pt-2 border-t border-teal-800/50">
                    <span>Your local camera</span>
                    <span>Authenticated Saarthi session</span>
                  </div>
                </div>

              </div>

              {/* Call Controls */}
              <div className="flex justify-center items-center gap-4 bg-white p-3.5 rounded-2xl border border-teal-100 max-w-sm mx-auto shadow-md">
                <button 
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    micEnabled ? 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                  title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micEnabled ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
                </button>

                <button 
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    videoEnabled ? 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                  title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {videoEnabled ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5" />}
                </button>

                <button 
                  onClick={endVideoCall}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Consult</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* 4. INTERCONNECTED MODULES LINK - Banner pointing to SymptoScan */}
      <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-teal-950 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-700" />
            <span>Unsure about your symptoms?</span>
          </h4>
          <p className="text-xs text-teal-900 leading-relaxed font-semibold">
            Evaluate your conditions using SymptoScan before consulting. It generates a clear question list to ask during your appointment.
          </p>
        </div>
        <button 
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab('symptom');
            }
          }}
          className="shrink-0 px-5 py-3 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>Check SymptoScan AI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SAARTHI THEMED SECURE CHECKOUT MODAL WITH RESPONSIVE UPI QR */}
      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-[#ECE8F5] shadow-xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left font-sans">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#6D5BD0] to-[#8B78E6] px-5 py-3.5 text-white relative shrink-0">
              <button 
                onClick={() => setPaymentModalData(null)}
                className="absolute top-3.5 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-white/90" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">Saarthi Telehealth Checkout</span>
              </div>
              <h3 className="font-outfit text-base font-black text-white">{paymentModalData.doctorName}</h3>
              <p className="text-xs text-white/90 font-medium">Saarthi demo consultation amount: <strong className="text-white text-xs">₹{paymentModalData.amount}</strong></p>
            </div>

            {/* Modal Content */}
            {appointmentSaved ? (
              <div className="p-6 text-center space-y-3 overflow-y-auto flex-1">
                <CheckCircle2 className="w-10 h-10 text-[#3B826E] mx-auto animate-bounce" />
                <h4 className="font-outfit font-extrabold text-[#2D2A4A] text-sm">Appointment Saved</h4>
                <p className="text-xs text-[#5F6473] leading-relaxed">
                  The appointment is pending payment verification. This does not create a booking in the OpenStreetMap-listed provider's scheduling system.
                </p>
              </div>
            ) : (
              <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
                {/* Method Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F3FA] rounded-xl border border-[#ECE8F5]">
                  <button
                    onClick={() => setPaymentTab('upi')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      paymentTab === 'upi'
                        ? 'bg-[#6D5BD0] text-white shadow-xs'
                        : 'text-[#5F6473] hover:text-[#2D2A4A]'
                    }`}
                  >
                    UPI / QR Code Scan
                  </button>
                  <button
                    onClick={() => setPaymentTab('stripe')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      paymentTab === 'stripe'
                        ? 'bg-[#6D5BD0] text-white shadow-xs'
                        : 'text-[#5F6473] hover:text-[#2D2A4A]'
                    }`}
                  >
                    Stripe Card Pay
                  </button>
                </div>

                {paymentTab === 'upi' ? (
                  <div className="space-y-3 text-center">
                    <div className="p-3 bg-[#FAF8FC] rounded-2xl border border-[#ECE8F5] inline-block mx-auto shadow-xs">
                      {/* Responsive Live UPI QR Code */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=saarthi.health@upi&pn=SaarthiHealth&am=${paymentModalData.amount}&cu=INR`)}`}
                        alt="UPI Payment QR Code"
                        className="w-32 h-32 mx-auto rounded-lg"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#6D5BD0] bg-[#B6A8F8]/15 px-2 py-0.5 rounded border border-[#B6A8F8]/30">
                        Scan with GPay / BHIM / PhonePe / Paytm
                      </span>
                      <p className="text-xs text-[#2D2A4A] font-bold mt-1">UPI ID: <span className="text-[#6D5BD0]">saarthi.health@upi</span></p>
                    </div>

                    <button 
                      onClick={() => handleConfirmPayment('upi')}
                      className="w-full py-2.5 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Pending Appointment</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center font-sans">
                    <div className="p-4 bg-[#FAF8FC] border border-[#ECE8F5] rounded-2xl text-left space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2D2A4A]">
                        <ShieldCheck className="w-4 h-4 text-[#6D5BD0]" />
                        <span>Secure Stripe-hosted checkout</span>
                      </div>
                      <p className="text-[11px] text-[#5F6473] leading-relaxed">
                        Saarthi does not collect card details here. Continue to Stripe's hosted page to submit the ₹{paymentModalData.amount} demo payment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmPayment('stripe')}
                      className="w-full py-3 bg-[#6D5BD0] hover:bg-[#5b4ab9] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4 text-white" />
                      <span>Continue to Stripe Checkout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* POST-CONSULTATION RATING MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-teal-100/80 shadow-2xl max-w-md w-full overflow-hidden text-left p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            {ratingSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="font-outfit text-xl font-black text-teal-950">Thank You for Your Feedback!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your rating helps other women on Saarthi find trusted gynecologists and telehealth specialists.
                </p>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer mt-4"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-150/40">
                      Consultation Complete
                    </span>
                    <h3 className="font-outfit text-lg font-black text-teal-950 mt-2">Rate Your Consultation</h3>
                    <p className="text-xs text-muted-foreground">How was your WebRTC demo session?</p>
                  </div>
                  <button 
                    onClick={() => setShowRatingModal(false)} 
                    className="p-1 text-muted-foreground hover:text-teal-950 rounded-full hover:bg-teal-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 5-Star Rating Selector */}
                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1.5 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                    >
                      <Star 
                        className={`w-7 h-7 ${
                          star <= ratingStars 
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs' 
                            : 'text-gray-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs font-extrabold text-teal-850">
                  {ratingStars === 5 ? '🌟 Excellent Consultation!' : ratingStars === 4 ? '👍 Very Good' : ratingStars === 3 ? '👌 Satisfactory' : 'Fair'}
                </p>

                {/* Quick Feedback Badges */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-teal-900">What did you like about the call?</label>
                  <div className="flex flex-wrap gap-2">
                    {["Clear Advice 💡", "Empathic Listener ❤️", "Punctual ⏰", "Thorough Diagnosis 🩺"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (selectedBadges.includes(tag)) {
                            setSelectedBadges(selectedBadges.filter(t => t !== tag));
                          } else {
                            setSelectedBadges([...selectedBadges, tag]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selectedBadges.includes(tag)
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'bg-teal-50 text-teal-900 border border-teal-150 hover:bg-teal-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Textarea */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-teal-900">Write a quick review (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Tell us more about your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full border border-teal-100 rounded-xl p-3 text-xs bg-teal-50/10 focus:outline-none focus:ring-2 focus:ring-teal-800"
                  />
                </div>

                <button
                  onClick={() => setRatingSubmitted(true)}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
                >
                  Submit Consultation Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default GynConnect;
