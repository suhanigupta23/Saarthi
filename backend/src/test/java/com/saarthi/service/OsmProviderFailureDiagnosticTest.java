package com.saarthi.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLHandshakeException;
import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OsmProviderFailureDiagnosticTest {

    private static final String PRIVATE_CONTENT = "private-overpass-query-or-response-body";
    private static final String PRIVATE_IDENTITY = "patient@example.com";
    private static final String PRIVATE_JWT = "Bearer private-jwt-value";

    @Test
    void classifiesHttp429AndPreservesCause() {
        RuntimeException upstream = HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                HttpHeaders.EMPTY,
                PRIVATE_CONTENT.getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=HTTP_429 httpStatus=429 exception="
                        + upstream.getClass().getSimpleName(),
                captured.logMessage());
        assertSame(upstream, captured.thrown().getCause());
    }

    @Test
    void classifiesHttp5xx() {
        RuntimeException upstream = HttpServerErrorException.create(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Service Unavailable",
                HttpHeaders.EMPTY,
                PRIVATE_CONTENT.getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=HTTP_5XX httpStatus=503 exception="
                        + upstream.getClass().getSimpleName(),
                captured.logMessage());
    }

    @Test
    void classifiesConnectionOrReadTimeout() {
        RuntimeException upstream = new ResourceAccessException(
                PRIVATE_CONTENT,
                new SocketTimeoutException(PRIVATE_CONTENT)
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=CONNECT_OR_READ_TIMEOUT httpStatus=none exception=SocketTimeoutException",
                captured.logMessage());
    }

    @Test
    void classifiesDnsFailure() {
        RuntimeException upstream = new ResourceAccessException(
                PRIVATE_CONTENT,
                new UnknownHostException(PRIVATE_CONTENT)
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=DNS_FAILURE httpStatus=none exception=UnknownHostException",
                captured.logMessage());
    }

    @Test
    void classifiesTlsHandshakeFailure() {
        RuntimeException upstream = new ResourceAccessException(
                PRIVATE_CONTENT,
                new SSLHandshakeException(PRIVATE_CONTENT)
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=TLS_HANDSHAKE_FAILURE httpStatus=none exception=SSLHandshakeException",
                captured.logMessage());
    }

    @Test
    void classifiesConnectionRefused() {
        RuntimeException upstream = new ResourceAccessException(
                PRIVATE_CONTENT,
                new ConnectException(PRIVATE_CONTENT)
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=CONNECTION_REFUSED httpStatus=none exception=ConnectException",
                captured.logMessage());
    }

    @Test
    void classifiesConnectionResetWithoutLoggingSocketMessage() {
        RuntimeException upstream = new ResourceAccessException(
                PRIVATE_CONTENT,
                new SocketException("Connection reset: " + PRIVATE_CONTENT)
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=CONNECTION_RESET httpStatus=none exception=SocketException",
                captured.logMessage());
    }

    @Test
    void retainsGenericTransportCategoryForOtherIoFailures() {
        RuntimeException upstream = new ResourceAccessException(
                PRIVATE_CONTENT,
                new IOException(PRIVATE_CONTENT)
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=TRANSPORT_FAILURE httpStatus=none exception=ResourceAccessException",
                captured.logMessage());
    }

    @Test
    void classifiesResponseShapeFailure() {
        StubRestTemplate restTemplate = new StubRestTemplate();
        restTemplate.response = ResponseEntity.ok(Map.of(
                "elements", Map.of("private", PRIVATE_CONTENT)
        ));

        CapturedFailure captured = captureFailure(restTemplate);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=RESPONSE_SHAPE httpStatus=none exception=OsmProviderException",
                captured.logMessage());
    }

    @Test
    void classifiesInterruption() {
        RuntimeException upstream = new OsmProviderService.OsmProviderException(
                "Interrupted while waiting to query Overpass",
                new InterruptedException(PRIVATE_CONTENT)
        );

        CapturedFailure captured = captureFailure(upstream);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=INTERRUPTED httpStatus=none exception=InterruptedException",
                captured.logMessage());
    }

    @Test
    void classifiesUnexpectedFailureWithoutChangingItsType() {
        IllegalStateException upstream = new IllegalStateException(PRIVATE_CONTENT);

        CapturedFailure captured = captureFailure(upstream, IllegalStateException.class);

        assertEquals(
                "OSM_PROVIDER_FAILURE reason=UNEXPECTED httpStatus=none exception=IllegalStateException",
                captured.logMessage());
        assertSame(upstream, captured.thrown());
    }

    private CapturedFailure captureFailure(RuntimeException upstream) {
        StubRestTemplate restTemplate = new StubRestTemplate();
        restTemplate.failure = upstream;
        return captureFailure(restTemplate);
    }

    private CapturedFailure captureFailure(StubRestTemplate restTemplate) {
        return captureFailure(restTemplate, OsmProviderService.OsmProviderException.class);
    }

    private CapturedFailure captureFailure(RuntimeException upstream, Class<? extends RuntimeException> expectedType) {
        StubRestTemplate restTemplate = new StubRestTemplate();
        restTemplate.failure = upstream;
        return captureFailure(restTemplate, expectedType);
    }

    private CapturedFailure captureFailure(
            StubRestTemplate restTemplate,
            Class<? extends RuntimeException> expectedType) {
        Logger logger = (Logger) LoggerFactory.getLogger(OsmProviderService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            OsmProviderService service = new OsmProviderService(
                    restTemplate, "https://example.test/overpass", 0);
            RuntimeException thrown = assertThrows(expectedType, () ->
                    service.searchNearbyProviders(23.2599, 77.4126, 25, "gyno"));

            assertEquals(1, appender.list.size(), "Each failed search must emit exactly one warning");
            ILoggingEvent event = appender.list.get(0);
            assertEquals(Level.WARN, event.getLevel());
            String logMessage = event.getFormattedMessage();
            assertSanitized(logMessage);
            return new CapturedFailure(thrown, logMessage);
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    private void assertSanitized(String logMessage) {
        assertFalse(logMessage.contains(PRIVATE_CONTENT));
        assertFalse(logMessage.contains(PRIVATE_IDENTITY));
        assertFalse(logMessage.contains(PRIVATE_JWT));
        assertFalse(logMessage.contains("23.2599"));
        assertFalse(logMessage.contains("77.4126"));
        assertFalse(logMessage.contains("data="));
    }

    private record CapturedFailure(RuntimeException thrown, String logMessage) {
    }

    private static class StubRestTemplate extends RestTemplate {
        private RuntimeException failure;
        private ResponseEntity<?> response;

        @Override
        @SuppressWarnings("unchecked")
        public <T> ResponseEntity<T> exchange(
                String url,
                HttpMethod method,
                HttpEntity<?> requestEntity,
                Class<T> responseType,
                Object... uriVariables) {
            if (failure != null) {
                throw failure;
            }
            return (ResponseEntity<T>) response;
        }
    }
}
