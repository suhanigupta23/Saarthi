package com.saarthi.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.security.JwtUtil;
import com.saarthi.security.UserDetailsServiceImpl;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Component
public class SignalingHandler extends TextWebSocketHandler {

    static final int MAX_SIGNALING_MESSAGE_BYTES = 65_536;
    private static final Pattern APPOINTMENT_REFERENCE = Pattern.compile("APT-[A-Z0-9]{8}");
    private static final String VIDEO_MODE = "Online Video Call";

    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;
    private final AppointmentRepository appointmentRepository;
    private final Map<String, ConnectionState> connections = new ConcurrentHashMap<>();
    private final Map<String, CallRoom> rooms = new ConcurrentHashMap<>();

    public SignalingHandler(
            ObjectMapper objectMapper,
            JwtUtil jwtUtil,
            UserDetailsServiceImpl userDetailsService,
            AppointmentRepository appointmentRepository) {
        this.objectMapper = objectMapper;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        connections.put(session.getId(), new ConnectionState(session));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        ConnectionState state = connections.get(session.getId());
        if (state == null) {
            sendError(session, null, "CONNECTION_NOT_REGISTERED", "Signaling connection is not registered.");
            return;
        }
        if (message.getPayloadLength() > MAX_SIGNALING_MESSAGE_BYTES) {
            sendError(session, state.callId, "MESSAGE_TOO_LARGE", "Signaling message is too large.");
            closeQuietly(session, CloseStatus.POLICY_VIOLATION);
            removeConnection(state, false);
            return;
        }

        final IncomingSignal signal;
        try {
            signal = objectMapper.readValue(message.getPayload(), IncomingSignal.class);
        } catch (Exception exception) {
            sendError(session, state.callId, "MALFORMED_MESSAGE", "Signaling message must be valid JSON.");
            return;
        }

        SignalType type = SignalType.from(signal.type());
        if (type == null) {
            sendError(session, state.callId, "UNSUPPORTED_TYPE", "Unsupported signaling message type.");
            return;
        }
        if (type == SignalType.JOIN) {
            joinCall(state, signal);
            return;
        }
        if (state.username == null || state.callId == null) {
            sendError(session, signal.callId(), "AUTHENTICATION_REQUIRED", "Authenticate and join a call before signaling.");
            return;
        }
        if (!state.callId.equals(signal.callId())) {
            sendError(session, state.callId, "CALL_MISMATCH", "Messages may only be sent to the joined call.");
            return;
        }
        if (type == SignalType.LEAVE) {
            removeConnection(state, true);
            return;
        }
        if (!validPayload(type, signal.payload())) {
            sendError(session, state.callId, "INVALID_PAYLOAD", "Signaling payload is missing or invalid.");
            return;
        }
        forwardToPeer(state, type, signal.payload());
    }

    private void joinCall(ConnectionState state, IncomingSignal signal) {
        if (state.username != null) {
            sendError(state.session, state.callId, "ALREADY_JOINED", "This connection has already joined a call.");
            return;
        }
        String callId = signal.callId() == null ? "" : signal.callId().trim().toUpperCase();
        String token = signal.payload() == null ? null : signal.payload().path("token").asText(null);
        if (!APPOINTMENT_REFERENCE.matcher(callId).matches()) {
            sendError(state.session, callId, "INVALID_CALL_ID", "Use a valid Saarthi appointment reference.");
            return;
        }

        final String username;
        try {
            username = jwtUtil.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!jwtUtil.validateToken(token, userDetails)) throw new IllegalArgumentException("Invalid token");
        } catch (Exception exception) {
            sendError(state.session, callId, "AUTHENTICATION_REQUIRED", "A valid Saarthi login is required.");
            return;
        }

        if (!appointmentRepository.existsByAppointmentRefAndUser_UsernameAndMode(callId, username, VIDEO_MODE)) {
            sendError(state.session, callId, "CALL_ACCESS_DENIED", "This video consultation does not belong to the authenticated user.");
            return;
        }

        CallRoom room = rooms.computeIfAbsent(callId, ignored -> new CallRoom());
        synchronized (room) {
            if (room.members.size() >= 2) {
                sendError(state.session, callId, "CALL_FULL", "This demo consultation already has two participants.");
                return;
            }
            state.username = username;
            state.callId = callId;
            room.members.put(state.session.getId(), state);
            send(state.session, new OutgoingSignal(
                    "JOINED", callId,
                    JsonNodeFactory.instance.objectNode()
                            .put("peerCount", room.members.size())
                            .put("authenticated", true)));

            if (room.members.size() == 2) {
                ConnectionState initiator = room.members.values().iterator().next();
                send(initiator.session, new OutgoingSignal(
                        "PEER_READY", callId,
                        JsonNodeFactory.instance.objectNode().put("createOffer", true)));
            }
        }
    }

    private boolean validPayload(SignalType type, JsonNode payload) {
        if (payload == null || !payload.isObject()) return false;
        return switch (type) {
            case OFFER -> "offer".equals(payload.path("type").asText())
                    && nonBlankWithin(payload.path("sdp").asText(null), MAX_SIGNALING_MESSAGE_BYTES);
            case ANSWER -> "answer".equals(payload.path("type").asText())
                    && nonBlankWithin(payload.path("sdp").asText(null), MAX_SIGNALING_MESSAGE_BYTES);
            case ICE_CANDIDATE -> nonBlankWithin(payload.path("candidate").asText(null), 4_096);
            default -> false;
        };
    }

    private boolean nonBlankWithin(String value, int maximumLength) {
        return value != null && !value.isBlank() && value.length() <= maximumLength;
    }

    private void forwardToPeer(ConnectionState sender, SignalType type, JsonNode payload) {
        CallRoom room = rooms.get(sender.callId);
        if (room == null) return;
        synchronized (room) {
            for (ConnectionState member : room.members.values()) {
                if (!member.session.getId().equals(sender.session.getId()) && member.session.isOpen()) {
                    send(member.session, new OutgoingSignal(type.name(), sender.callId, payload));
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        ConnectionState state = connections.get(session.getId());
        if (state != null) removeConnection(state, true);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        ConnectionState state = connections.get(session.getId());
        if (state != null) removeConnection(state, true);
        closeQuietly(session, CloseStatus.SERVER_ERROR);
    }

    private void removeConnection(ConnectionState state, boolean notifyPeer) {
        connections.remove(state.session.getId());
        String callId = state.callId;
        if (callId == null) return;
        CallRoom room = rooms.get(callId);
        if (room == null) return;
        synchronized (room) {
            room.members.remove(state.session.getId());
            if (notifyPeer) {
                JsonNode payload = JsonNodeFactory.instance.objectNode().put("reason", "peer_left");
                for (ConnectionState member : room.members.values()) {
                    send(member.session, new OutgoingSignal("PEER_LEFT", callId, payload));
                }
            }
            if (room.members.isEmpty()) rooms.remove(callId, room);
        }
        state.callId = null;
        state.username = null;
    }

    private void sendError(WebSocketSession session, String callId, String code, String message) {
        send(session, new OutgoingSignal(
                "ERROR", callId,
                JsonNodeFactory.instance.objectNode().put("code", code).put("message", message)));
    }

    private void send(WebSocketSession session, OutgoingSignal signal) {
        if (!session.isOpen()) return;
        try {
            String json = objectMapper.writeValueAsString(signal);
            synchronized (session) {
                if (session.isOpen()) session.sendMessage(new TextMessage(json));
            }
        } catch (IOException ignored) {
            // A later close/error callback removes the stale session.
        }
    }

    private void closeQuietly(WebSocketSession session, CloseStatus status) {
        try {
            if (session.isOpen()) session.close(status);
        } catch (IOException ignored) {
            // The session is already unusable.
        }
    }

    String authenticatedUsername(String sessionId) {
        ConnectionState state = connections.get(sessionId);
        return state == null ? null : state.username;
    }

    int roomSize(String callId) {
        CallRoom room = rooms.get(callId);
        if (room == null) return 0;
        synchronized (room) {
            return room.members.size();
        }
    }

    private enum SignalType {
        JOIN, OFFER, ANSWER, ICE_CANDIDATE, LEAVE;

        static SignalType from(String value) {
            if (value == null) return null;
            try {
                return valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException exception) {
                return null;
            }
        }
    }

    private record IncomingSignal(String type, String callId, JsonNode payload) {
    }

    private record OutgoingSignal(String type, String callId, JsonNode payload) {
    }

    private static final class ConnectionState {
        private final WebSocketSession session;
        private volatile String username;
        private volatile String callId;

        private ConnectionState(WebSocketSession session) {
            this.session = session;
        }
    }

    private static final class CallRoom {
        private final Map<String, ConnectionState> members = new LinkedHashMap<>();
    }
}
