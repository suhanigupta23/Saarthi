package com.saarthi.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saarthi.model.Appointment;
import com.saarthi.model.User;
import com.saarthi.repository.AppointmentRepository;
import com.saarthi.repository.UserRepository;
import com.saarthi.security.JwtUtil;
import com.saarthi.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.test.context.support.DependencyInjectionTestExecutionListener;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketExtension;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:signaling;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@TestExecutionListeners(
        listeners = DependencyInjectionTestExecutionListener.class,
        mergeMode = TestExecutionListeners.MergeMode.REPLACE_DEFAULTS
)
class SignalingHandlerIntegrationTest {

    private static final String CALL_A = "APT-ROOMA001";
    private static final String CALL_B = "APT-ROOMB001";

    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserDetailsServiceImpl userDetailsService;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private UserRepository userRepository;

    private SignalingHandler handler;
    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        userRepository.deleteAll();
        User alice = userRepository.save(new User("alice@example.com", "hash", "Alice"));
        User bob = userRepository.save(new User("bob@example.com", "hash", "Bob"));
        appointmentRepository.save(videoAppointment(alice, CALL_A, "osm-A"));
        appointmentRepository.save(videoAppointment(bob, CALL_B, "osm-B"));
        aliceToken = tokenFor(alice.getUsername());
        bobToken = tokenFor(bob.getUsername());
        handler = new SignalingHandler(objectMapper, jwtUtil, userDetailsService, appointmentRepository);
    }

    @Test
    void unauthenticatedSignalsAndInvalidTokensAreRejected() throws Exception {
        FakeSession session = connect("unauthenticated");

        send(session, "OFFER", CALL_A, objectMapper.readTree("{\"type\":\"offer\",\"sdp\":\"v=0\"}"));
        assertEquals("AUTHENTICATION_REQUIRED", session.lastPayload().path("payload").path("code").asText());

        sendJoin(session, CALL_A, "invalid.jwt.value", "spoofed@example.com");
        assertEquals("AUTHENTICATION_REQUIRED", session.lastPayload().path("payload").path("code").asText());
        assertNull(handler.authenticatedUsername(session.getId()));
        assertEquals(0, handler.roomSize(CALL_A));
    }

    @Test
    void authenticatedIdentityIsServerDerivedAndAppointmentOwnershipIsRequired() throws Exception {
        FakeSession owner = connect("owner");
        sendJoin(owner, CALL_A, aliceToken, "spoofed@example.com");

        assertEquals("JOINED", owner.lastPayload().path("type").asText());
        assertEquals("alice@example.com", handler.authenticatedUsername(owner.getId()));

        FakeSession stranger = connect("stranger");
        sendJoin(stranger, CALL_A, bobToken, "alice@example.com");
        assertEquals("CALL_ACCESS_DENIED", stranger.lastPayload().path("payload").path("code").asText());
        assertNull(handler.authenticatedUsername(stranger.getId()));
    }

    @Test
    void offerAnswerAndIceRemainInsideTheirAppointmentRoom() throws Exception {
        FakeSession a1 = joined("a1", CALL_A, aliceToken);
        FakeSession a2 = joined("a2", CALL_A, aliceToken);
        FakeSession b1 = joined("b1", CALL_B, bobToken);
        FakeSession b2 = joined("b2", CALL_B, bobToken);
        clear(a1, a2, b1, b2);

        JsonNode offer = objectMapper.readTree("{\"type\":\"offer\",\"sdp\":\"v=0 offer-a\"}");
        send(a1, "OFFER", CALL_A, offer);
        assertEquals(List.of("OFFER"), a2.types());
        assertTrue(a1.types().isEmpty());
        assertTrue(b1.types().isEmpty());
        assertTrue(b2.types().isEmpty());

        JsonNode answer = objectMapper.readTree("{\"type\":\"answer\",\"sdp\":\"v=0 answer-a\"}");
        send(a2, "ANSWER", CALL_A, answer);
        assertEquals(List.of("ANSWER"), a1.types());
        assertTrue(b1.types().isEmpty());
        assertTrue(b2.types().isEmpty());

        JsonNode candidate = objectMapper.readTree("{\"candidate\":\"candidate:1 1 UDP 1 127.0.0.1 9999 typ host\",\"sdpMid\":\"0\",\"sdpMLineIndex\":0}");
        send(a1, "ICE_CANDIDATE", CALL_A, candidate);
        assertEquals(List.of("OFFER", "ICE_CANDIDATE"), a2.types());
        assertTrue(b1.types().isEmpty());
        assertTrue(b2.types().isEmpty());

        System.out.println("SIGNALING_ISOLATION_EXPERIMENT callAMessagesDeliveredOutsideRoom=0 offerRecipients=1 answerRecipients=1 iceRecipients=1");
    }

    @Test
    void malformedUnsupportedAndMismatchedMessagesAreHandledSafely() throws Exception {
        FakeSession session = joined("safe-errors", CALL_A, aliceToken);
        session.clear();

        handler.handleTextMessage(session, new TextMessage("not-json"));
        assertEquals("MALFORMED_MESSAGE", session.lastPayload().path("payload").path("code").asText());

        send(session, "CHAT", CALL_A, objectMapper.createObjectNode());
        assertEquals("UNSUPPORTED_TYPE", session.lastPayload().path("payload").path("code").asText());

        send(session, "OFFER", CALL_B, objectMapper.readTree("{\"type\":\"offer\",\"sdp\":\"v=0\"}"));
        assertEquals("CALL_MISMATCH", session.lastPayload().path("payload").path("code").asText());
        assertTrue(session.isOpen());
    }

    @Test
    void disconnectRemovesMembershipAndNotifiesRemainingPeer() throws Exception {
        FakeSession first = joined("first", CALL_A, aliceToken);
        FakeSession second = joined("second", CALL_A, aliceToken);
        clear(first, second);
        assertEquals(2, handler.roomSize(CALL_A));

        handler.afterConnectionClosed(second, CloseStatus.NORMAL);

        assertEquals(1, handler.roomSize(CALL_A));
        assertEquals(List.of("PEER_LEFT"), first.types());
        assertNull(handler.authenticatedUsername(second.getId()));

        handler.afterConnectionClosed(first, CloseStatus.NORMAL);
        assertEquals(0, handler.roomSize(CALL_A));
    }

    private Appointment videoAppointment(User user, String reference, String providerId) {
        return new Appointment(
                user, reference, providerId, "Demo provider", "Gynecology", "Demo clinic",
                "2026-10-04", "10:00", "Online Video Call", "PENDING_PAYMENT", 500, LocalDateTime.now());
    }

    private String tokenFor(String username) {
        UserDetails details = userDetailsService.loadUserByUsername(username);
        return jwtUtil.generateToken(details);
    }

    private FakeSession connect(String id) {
        FakeSession session = new FakeSession(id, objectMapper);
        handler.afterConnectionEstablished(session);
        return session;
    }

    private FakeSession joined(String id, String callId, String token) throws Exception {
        FakeSession session = connect(id);
        sendJoin(session, callId, token, "ignored-client-identity");
        assertEquals("JOINED", session.messages.get(0).path("type").asText());
        return session;
    }

    private void sendJoin(FakeSession session, String callId, String token, String untrustedSender) throws Exception {
        JsonNode payload = objectMapper.createObjectNode()
                .put("token", token)
                .put("sender", untrustedSender);
        send(session, "JOIN", callId, payload);
    }

    private void send(FakeSession session, String type, String callId, JsonNode payload) throws Exception {
        JsonNode message = objectMapper.createObjectNode()
                .put("type", type)
                .put("callId", callId)
                .set("payload", payload);
        handler.handleTextMessage(session, new TextMessage(objectMapper.writeValueAsString(message)));
    }

    private void clear(FakeSession... sessions) {
        for (FakeSession session : sessions) session.clear();
    }

    private static final class FakeSession implements WebSocketSession {
        private final String id;
        private final ObjectMapper objectMapper;
        private final Map<String, Object> attributes = new HashMap<>();
        private final List<JsonNode> messages = new ArrayList<>();
        private boolean open = true;
        private int textLimit;
        private int binaryLimit;

        private FakeSession(String id, ObjectMapper objectMapper) {
            this.id = id;
            this.objectMapper = objectMapper;
        }

        private JsonNode lastPayload() {
            return messages.get(messages.size() - 1);
        }

        private List<String> types() {
            return messages.stream().map(message -> message.path("type").asText()).toList();
        }

        private void clear() {
            messages.clear();
        }

        @Override public String getId() { return id; }
        @Override public URI getUri() { return URI.create("ws://localhost/ws/signaling"); }
        @Override public HttpHeaders getHandshakeHeaders() { return HttpHeaders.EMPTY; }
        @Override public Map<String, Object> getAttributes() { return attributes; }
        @Override public Principal getPrincipal() { return null; }
        @Override public InetSocketAddress getLocalAddress() { return null; }
        @Override public InetSocketAddress getRemoteAddress() { return null; }
        @Override public String getAcceptedProtocol() { return null; }
        @Override public void setTextMessageSizeLimit(int messageSizeLimit) { textLimit = messageSizeLimit; }
        @Override public int getTextMessageSizeLimit() { return textLimit; }
        @Override public void setBinaryMessageSizeLimit(int messageSizeLimit) { binaryLimit = messageSizeLimit; }
        @Override public int getBinaryMessageSizeLimit() { return binaryLimit; }
        @Override public List<WebSocketExtension> getExtensions() { return List.of(); }

        @Override
        public void sendMessage(WebSocketMessage<?> message) throws IOException {
            if (message instanceof TextMessage textMessage) {
                messages.add(objectMapper.readTree(textMessage.getPayload()));
            } else if (message instanceof BinaryMessage || message instanceof PingMessage || message instanceof PongMessage) {
                throw new IOException("Unexpected non-text test message");
            }
        }

        @Override public boolean isOpen() { return open; }
        @Override public void close() { open = false; }
        @Override public void close(CloseStatus status) { open = false; }
    }
}
