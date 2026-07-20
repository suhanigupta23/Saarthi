import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Phone, Video, Users, AlertCircle, CheckCircle,
  Mic, MicOff, VideoOff, PhoneOff, RefreshCw, Star, ArrowRight, BrainCircuit, HeartHandshake, HelpCircle, Activity
} from 'lucide-react';
import { API_BASE } from '../App.jsx';

function GynConnect({ isLoggedIn, onRequireAuth }) {
  const [activeSection, setActiveSection] = useState('onboarding'); // 'onboarding', 'nearby', 'consult'
  const [selectedSpecialty, setSelectedSpecialty] = useState(''); // 'gyno', 'maternity', 'psychologist'
  const [selectedMode, setSelectedMode] = useState(''); // 'video', 'visit'
  
  const [doctors, setDoctors] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Bhopal, MP'); // Default location
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [hoveredDoctorId, setHoveredDoctorId] = useState(null);
  const [selectedMapDoctor, setSelectedMapDoctor] = useState(null);
  const [mapQuery, setMapQuery] = useState('Gynecologists near Bhopal');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isScanningLocation, setIsScanningLocation] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');

  // WebRTC & Call states
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [roomId, setRoomId] = useState('101');
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Check URL query parameters for Stripe payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      try {
        const savedAppts = localStorage.getItem('saarthi_appointments');
        if (savedAppts) {
          const appts = JSON.parse(savedAppts);
          const updated = appts.map(a => {
            if (a.status.includes('Pending')) {
              return { ...a, status: 'Confirmed 🟢' };
            }
            return a;
          });
          localStorage.setItem('saarthi_appointments', JSON.stringify(updated));
        }
      } catch (err) {
        console.error(err);
      }
      // Remove query parameters from URL for clean display
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDoctorPayment = async (doctorName, amount) => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    
    // Save appointment record locally first
    try {
      const savedAppts = localStorage.getItem('saarthi_appointments');
      const appts = savedAppts ? JSON.parse(savedAppts) : [];
      const matchedDoc = doctors.find(d => d.name === doctorName);
      
      const newAppt = {
        id: `APT-${Math.floor(1000 + Math.random() * 9000)}-${(matchedDoc?.city || 'Kota').toUpperCase()}`,
        doctorName: doctorName,
        speciality: matchedDoc?.speciality || 'Gynecologist',
        timing: matchedDoc?.timing || '10 AM - 1 PM',
        fee: amount,
        status: 'Stripe Pending 🟡',
        date: new Date().toLocaleDateString()
      };
      
      localStorage.setItem('saarthi_appointments', JSON.stringify([newAppt, ...appts]));
    } catch (err) {
      console.error("Error storing appointment locally:", err);
    }

    try {
      const token = localStorage.getItem('saarthi_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/payment/checkout`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ doctorName, amount })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error(`Checkout response error (${response.status}):`, errText);
        alert(`Server Error (${response.status}): ${errText || response.statusText || 'Failed to initialize session'}`);
        return;
      }

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // Redirect to Stripe Checkout!
      } else {
        alert("Failed to initiate payment session: " + (data.error || 'Unknown Error'));
      }
    } catch (e) {
      console.error("Fetch Exception:", e);
      alert(`Network Error: ${e.message || 'Stripe Payment server offline'}. Make sure Spring Boot backend is running.`);
    }
  };

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  const generateSimulatedDoctors = (city, specialty) => {
    let specName = "Gynecologist";
    let clinicSuffixes = ["Women Clinic", "Care & Maternity Hospital", "Maternity Centre", "Health Clinic", "Ankur Clinic"];
    if (specialty === 'maternity') {
      specName = "Maternity Specialist";
      clinicSuffixes = ["Maternity Hospital", "Motherhood Maternity Centre", "Vatsalya Home", "Hope Hospital", "Maternity Care Hub"];
    } else if (specialty === 'psychologist') {
      specName = "Maternity Psychologist";
      clinicSuffixes = ["Mind & Postpartum Wellness", "Postpartum Mind Centre", "Nirvana Mental Care", "Vani Mind Clinic", "Mental Wellness Clinic"];
    }

    const firstNames = ["Dr. Smita", "Dr. Neha", "Dr. Preeti", "Dr. Shalini", "Dr. Alaka", "Dr. Kirti", "Dr. Ananya", "Dr. Sunita", "Dr. Rashmi", "Dr. Sandhya", "Dr. Ritu"];
    const lastNames = ["Agrawal", "Jain", "Verma", "Gupta", "Sharma", "Saxena", "Mishra", "Deshmukh", "Sen", "Dave", "Bhargava"];
    
    const getSeed = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    
    const seed = getSeed(city + specName);
    const result = [];
    
    for (let i = 0; i < 5; i++) {
      const fnIdx = (seed + i * 7) % firstNames.length;
      const lnIdx = (seed + i * 13) % lastNames.length;
      const clinicIdx = (seed + i * 3) % clinicSuffixes.length;
      const rating = (4.5 + ((seed + i * 9) % 5) * 0.1).toFixed(1);
      const distance = (1.1 + ((seed + i * 17) % 50) * 0.1).toFixed(1);
      const fee = 300 + ((seed + i * 4) % 5) * 100;
      const timing = (9 + (i % 3)) + " AM - " + (2 + (i % 4)) + " PM";
      
      // Coordinates offset from map center (250, 200) inside SVG
      const latOffset = -0.015 + ((seed + i * 23) % 30) * 0.001;
      const lngOffset = -0.015 + ((seed + i * 29) % 30) * 0.001;

      result.push({
        id: `doc-${city}-${specialty}-${i}`,
        name: `${firstNames[fnIdx]} ${lastNames[lnIdx]}`,
        rating: parseFloat(rating),
        clinic: `${lastNames[lnIdx]} ${clinicSuffixes[clinicIdx]}`,
        city: city,
        timing: timing,
        speciality: specName,
        distance: parseFloat(distance),
        fee: fee,
        latOffset: latOffset,
        lngOffset: lngOffset
      });
    }
    return result;
  };

  const filterDoctorsList = (city) => {
    let specialtyKey = 'gyno';
    if (selectedSpecialty === 'maternity') specialtyKey = 'maternity';
    if (selectedSpecialty === 'psychologist') specialtyKey = 'psychologist';
    
    const localDocs = generateSimulatedDoctors(city, specialtyKey);
    setDoctors(localDocs);
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
  }, []);

  // Fetch coordinates and search doctors
  const handleUseLocation = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    triggerGPSScanFlow();
  };

  // WebRTC Peer Connection logic
  const startVideoCall = async () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    try {
      setInCall(true);
      setErrorMsg('');

      // 1. Get media streams
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Open WebSocket signaling socket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/signaling`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("WebSocket Signaling Connected.");
        initiatePeerConnection(stream);
      };

      socketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'offer') {
          await handleOffer(data.offer);
        } else if (data.type === 'answer') {
          await handleAnswer(data.answer);
        } else if (data.type === 'candidate') {
          await handleIceCandidate(data.candidate);
        }
      };

      socketRef.current.onerror = (e) => {
        console.error("WebSocket Signaling Error:", e);
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket Signaling Closed.");
      };

    } catch (e) {
      console.error("Call initialization failed:", e);
      setErrorMsg(`Failed to open camera/mic: ${e.message}. Mocking peer stream for demonstration.`);
      mockPeerStream();
    }
  };

  const initiatePeerConnection = (stream) => {
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

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.streams[0]);
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send local ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate
        }));
      }
    };

    // Create and send SDP Offer
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'offer',
            offer: pc.localDescription
          }));
        }
      })
      .catch(err => console.error("Offer creation error:", err));
  };

  const handleOffer = async (offer) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'answer',
          answer: answer
        }));
      }
    } catch (e) {
      console.error("Error handling SDP offer:", e);
    }
  };

  const handleAnswer = async (answer) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
      console.error("Error handling SDP answer:", e);
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("Error adding remote ICE candidate:", e);
    }
  };

  const endVideoCall = () => {
    setInCall(false);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
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

  const mockPeerStream = () => {
    setRemoteStream(true);
    setTimeout(() => {
      if (localVideoRef.current) {
        localVideoRef.current.src = "https://www.w3schools.com/html/mov_bbb.mp4";
        localVideoRef.current.loop = true;
        localVideoRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.src = "https://www.w3schools.com/html/movie.mp4";
        remoteVideoRef.current.loop = true;
        remoteVideoRef.current.play().catch(() => {});
      }
    }, 1000);
  };

  const triggerGPSScanFlow = () => {
    setShowLocationModal(false);
    setIsScanningLocation(true);
    setScanProgress(0);
    setScanStatusText('📡 Initializing geospatial scanner...');

    // Call geolocation API to scan coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const geoData = await res.json();
            if (geoData.city) {
              setLocationName(geoData.city);
              filterDoctorsList(geoData.city);
              let querySpecialty = "Gynecologists";
              if (selectedSpecialty === 'maternity') querySpecialty = "Maternity Specialists";
              if (selectedSpecialty === 'psychologist') querySpecialty = "Maternity Psychologists";
              setMapQuery(`${querySpecialty} near ${geoData.city}`);
            }
          } catch (err) {
            console.error(err);
          }
        },
        (error) => {
          console.error(error);
        }
      );
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
        setScanStatusText('🔍 Searching nearby verified female specialists...');
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

    // Initialize list based on user city
    filterDoctorsList(locationName);
    
    let querySpecialty = "Gynecologists";
    if (selectedSpecialty === 'maternity') querySpecialty = "Maternity Specialists";
    if (selectedSpecialty === 'psychologist') querySpecialty = "Maternity Psychologists";
    setMapQuery(`${querySpecialty} near ${locationName}`);

    if (selectedMode === 'video') {
      setActiveSection('consult');
    } else {
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
                Saarthi GynConnect requires GPS access to scan and identify verified gynecologists and clinics closest to your real-time coordinates.
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => {
                  setShowLocationModal(false);
                  setActiveSection('nearby'); // Fallback direct load
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
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-warm-200 pb-4 flex-wrap gap-4 text-left">
        <div>
          <h2 className="font-outfit text-4xl font-black tracking-tight text-warm-850">GynConnect Telehealth</h2>
          <p className="text-base font-semibold text-warm-550 mt-1.5">Connect with verified gynecologists, maternity specialists, and counselors near you.</p>
        </div>
        
        {activeSection !== 'onboarding' && (
          <button 
            onClick={() => {
              endVideoCall();
              setActiveSection('onboarding');
            }}
            className="px-5 py-2.5 text-sm font-extrabold rounded-xl border border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 transition-all cursor-pointer shadow-sm"
          >
            ← Reset Search
          </button>
        )}
      </div>

      {paymentSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex gap-2 items-center leading-relaxed text-left animate-in slide-in-from-top duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment Successful! Your consulting appointment slot has been verified and confirmed.</span>
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
        <div className="max-w-3xl mx-auto bg-white border border-teal-100 rounded-3xl p-8 shadow-soft space-y-8 animate-in zoom-in-95 duration-200 text-left">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center text-3xl mx-auto">🩺</div>
            <h3 className="text-2xl font-black text-teal-950">Specify Your Consult Requirements</h3>
            <p className="text-sm font-semibold text-muted-foreground">Select what type of care you need to filter and find real verified doctors.</p>
          </div>

          {/* Specialty selections */}
          <div className="space-y-4">
            <label className="text-sm font-black uppercase tracking-wider text-teal-900 block">STEP 1: WHICH SPECIALTY DO YOU NEED?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <button
                onClick={() => setSelectedSpecialty('gyno')}
                className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all cursor-pointer ${
                  selectedSpecialty === 'gyno' 
                    ? 'border-teal-500 bg-teal-50/50 text-teal-950 ring-2 ring-teal-600/20 shadow-sm' 
                    : 'border-teal-100 hover:bg-teal-50/20 text-teal-900 shadow-2xs'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-lg font-bold border border-teal-100">🩺</div>
                <div>
                  <h4 className="font-extrabold text-base">Gynecologist</h4>
                  <p className="text-xs font-medium text-muted-foreground mt-1">General organ, cycle, and reproductive health checks.</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedSpecialty('maternity')}
                className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all cursor-pointer ${
                  selectedSpecialty === 'maternity' 
                    ? 'border-teal-500 bg-teal-50/50 text-teal-950 ring-2 ring-teal-600/20 shadow-sm' 
                    : 'border-teal-100 hover:bg-teal-50/20 text-teal-900 shadow-2xs'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-lg font-bold border border-teal-100">🤰</div>
                <div>
                  <h4 className="font-extrabold text-base">Maternity Specialist</h4>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Pregnancy tracking, prenatal care, and baby delivery.</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedSpecialty('psychologist')}
                className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all cursor-pointer ${
                  selectedSpecialty === 'psychologist' 
                    ? 'border-teal-500 bg-teal-50/50 text-teal-950 ring-2 ring-teal-600/20 shadow-sm' 
                    : 'border-teal-100 hover:bg-teal-50/20 text-teal-900 shadow-2xs'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center text-lg font-bold border border-teal-100">🧠</div>
                <div>
                  <h4 className="font-extrabold text-base">Maternity Psychologist</h4>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Postpartum depression support and mental health.</p>
                </div>
              </button>

            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-4">
            <label className="text-sm font-black uppercase tracking-wider text-teal-900 block">STEP 2: HOW WOULD YOU LIKE TO CONSULT?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <button
                onClick={() => setSelectedMode('video')}
                className={`p-6 rounded-2xl border text-left flex items-center gap-4 transition-all cursor-pointer ${
                  selectedMode === 'video' 
                    ? 'border-teal-500 bg-teal-50/50 text-teal-950 ring-2 ring-teal-600/20 shadow-sm' 
                    : 'border-teal-100 hover:bg-teal-50/20 text-teal-900 shadow-2xs'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl font-bold border border-teal-100">📹</div>
                <div>
                  <h4 className="font-extrabold text-base">Online Video Call</h4>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Start virtual video consultations instantly from your home.</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMode('visit')}
                className={`p-6 rounded-2xl border text-left flex items-center gap-4 transition-all cursor-pointer ${
                  selectedMode === 'visit' 
                    ? 'border-teal-500 bg-teal-50/50 text-teal-950 ring-2 ring-teal-600/20 shadow-sm' 
                    : 'border-teal-100 hover:bg-teal-50/20 text-teal-900 shadow-2xs'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl font-bold border border-teal-100">📍</div>
                <div>
                  <h4 className="font-extrabold text-base">Visit Doctor Nearby</h4>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Locate clinical centers and doctors in your direct area.</p>
                </div>
              </button>

            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <button
              onClick={handleOnboardingSubmit}
              disabled={!selectedSpecialty || !selectedMode}
              className="w-full py-5 bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white rounded-2xl font-black transition-all shadow-md flex items-center justify-center gap-3 text-base tracking-wide cursor-pointer"
            >
              <span>Search and Connect Doctor</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}

      {/* 2. NEARBY DOCTORS LIST VIEW */}
      {activeSection === 'nearby' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div>
              <h3 className="font-outfit text-xl font-black text-warm-850 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-emerald-500" />
                <span>Geospatial Location Scan</span>
              </h3>
              <p className="text-sm font-semibold text-warm-500 mt-1.5">Locate verified female specialists near <strong className="text-emerald-600 font-extrabold">{locationName}</strong>.</p>
            </div>
            
            <button
              onClick={handleUseLocation}
              disabled={loadingLoc}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold transition-all shadow-md text-sm flex items-center gap-2 cursor-pointer"
            >
              {loadingLoc ? 'Fetching GPS...' : '📍 Scan My GPS Location'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-stretch">
            
            {/* Left Side: Doctor Cards List (Spans 5 columns) */}
            <div className="lg:col-span-5 space-y-4 max-h-[550px] overflow-y-auto pr-2">
              {doctors.map((doc) => {
                const isHovered = hoveredDoctorId === doc.id;
                const isSelectedOnMap = selectedMapDoctor?.id === doc.id;
                
                return (
                  <div 
                    key={doc.id} 
                    onMouseEnter={() => setHoveredDoctorId(doc.id)}
                    onMouseLeave={() => setHoveredDoctorId(null)}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                      isHovered || isSelectedOnMap
                        ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30 shadow-md' 
                        : 'border-warm-200 hover:border-warm-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black border border-emerald-100">
                          👩‍⚕️
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-amber-50 text-amber-800 font-extrabold border border-amber-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{doc.rating}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-outfit font-black text-warm-850 text-base">{doc.name}</h4>
                        <p className="text-xs text-emerald-600 font-black tracking-wide uppercase mt-0.5">{doc.speciality}</p>
                        <p className="text-sm text-warm-500 font-medium mt-1">{doc.clinic} • {doc.city}</p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-warm-100 pt-4 space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold text-warm-600">
                        <span>⏰ {doc.timing}</span>
                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/60">📍 {doc.distance} km away</span>
                      </div>
                      <button 
                        onClick={() => handleDoctorPayment(doc.name, doc.fee || 500)}
                        className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-extrabold text-xs shadow-sm transition-all text-center cursor-pointer"
                      >
                        💳 Pay & Book Appointment (₹{doc.fee || 500})
                      </button>
                      <button 
                        onClick={() => setMapQuery(`${doc.name}, ${doc.clinic}, ${doc.city}`)}
                        className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-extrabold text-xs border border-emerald-200 shadow-2xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>📍 View on Google Map</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Side: Fully Interactive Google Map Iframe (Spans 7 columns) */}
            <div className="lg:col-span-7 relative bg-warm-100 border border-warm-200 rounded-3xl overflow-hidden min-h-[500px] shadow-soft flex flex-col justify-between">
              
              {/* Map Floating Search Bar & Controls */}
              <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
                <div className="flex-1 bg-white/95 backdrop-blur-xs rounded-xl border border-warm-200 px-3 py-1.5 shadow-md flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                  <input 
                    type="text" 
                    value={mapQuery}
                    onChange={(e) => setMapQuery(e.target.value)}
                    placeholder="Search hospitals or specialists..."
                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-warm-850 placeholder:text-warm-400"
                  />
                </div>
                <button 
                  onClick={() => {
                    let querySpecialty = "Gynecologists";
                    if (selectedSpecialty === 'maternity') querySpecialty = "Maternity Specialists";
                    if (selectedSpecialty === 'psychologist') querySpecialty = "Maternity Psychologists";
                    setMapQuery(`${querySpecialty} near ${locationName}`);
                  }}
                  className="p-2.5 bg-white/95 hover:bg-white rounded-xl border border-warm-200 shadow-md text-warm-700 hover:text-emerald-600 transition-colors flex items-center justify-center cursor-pointer"
                  title="Reset Search to City"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingLoc ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>

              {/* Real Google Maps Iframe */}
              <iframe
                title="Google Maps"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '500px' }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full"
              ></iframe>

              {/* Google Maps Bottom Indicator Label */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xs border border-warm-200 px-3 py-1.5 rounded-lg shadow-sm text-[10px] font-bold text-warm-650 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Google Map Feed</span>
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
                <h3 className="text-xl font-bold text-warm-800">Instant Video Appointment</h3>
                <p className="text-sm text-warm-500 max-w-sm mx-auto leading-relaxed">
                  Join a secure, encrypted peer-to-peer session with an online doctor. Enter room ID to begin connection.
                </p>
              </div>

              <div className="flex gap-2 max-w-sm w-full">
                <input 
                  type="text" 
                  value={roomId} 
                  onChange={(e) => setRoomId(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  placeholder="Room ID" 
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
              
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-warm-200 shadow-sm text-left">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <p className="text-sm font-bold text-warm-800">Connected to Consulting Room ID: {roomId}</p>
                </div>
                <span className="text-xs text-warm-400">P2P Encryption Active</span>
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                
                {/* Local Video Panel */}
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-inner border border-warm-300 flex items-center justify-center">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                    You (Patient)
                  </div>
                  {!videoEnabled && (
                    <div className="absolute inset-0 bg-warm-900/90 flex items-center justify-center text-white text-sm font-medium">
                      Camera Disabled
                    </div>
                  )}
                </div>

                {/* Remote Video Panel */}
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-inner border border-warm-300 flex items-center justify-center">
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                    Consulting Doctor
                  </div>
                  {!remoteStream && (
                    <div className="absolute inset-0 bg-warm-900/90 flex flex-col items-center justify-center text-white text-sm gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <span>Waiting for doctor to connect...</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Call Controls */}
              <div className="flex justify-center items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-full border border-warm-200 max-w-sm mx-auto shadow-md">
                
                <button 
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition-colors ${
                    micEnabled ? 'bg-warm-100 text-warm-700 hover:bg-warm-200' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button 
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    videoEnabled ? 'bg-warm-100 text-warm-700 hover:bg-warm-200' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button 
                  onClick={endVideoCall}
                  className="p-3 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-sm"
                >
                  <PhoneOff className="w-5 h-5" />
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
        <a 
          href="#symptom" 
          onClick={(e) => {
            e.preventDefault();
            // Dispatch click on SymptoScan in sidebar or parent App state
            document.querySelector('button[key="symptom"]')?.dispatchEvent(new MouseEvent('click'));
          }}
          className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          Check Symptoms First
        </a>
      </div>

    </div>
  );
}

export default GynConnect;
