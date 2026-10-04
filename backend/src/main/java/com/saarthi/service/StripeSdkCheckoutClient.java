package com.saarthi.service;

import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class StripeSdkCheckoutClient implements StripeCheckoutClient {

    private final String stripeSecretKey;
    private final String frontendBaseUrl;

    public StripeSdkCheckoutClient(
            @Value("${stripe.secret-key:}") String stripeSecretKey,
            @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.stripeSecretKey = stripeSecretKey;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    @Override
    public CheckoutResult createCheckout(CheckoutCommand command) throws Exception {
        if (stripeSecretKey.isBlank()) {
            throw new IllegalStateException("STRIPE_API_SECRET_KEY is not configured");
        }

        String encodedRef = URLEncoder.encode(command.appointmentRef(), StandardCharsets.UTF_8);
        SessionCreateParams.Builder params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setClientReferenceId(command.appointmentRef())
                .setSuccessUrl(frontendBaseUrl + "/?payment=success&appointmentRef=" + encodedRef
                        + "&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendBaseUrl + "/?payment=cancel&appointmentRef=" + encodedRef)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(command.currency())
                                .setUnitAmount(command.amountInPaise())
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(command.productName())
                                        .build())
                                .build())
                        .build());
        command.metadata().forEach(params::putMetadata);

        RequestOptions requestOptions = RequestOptions.builder()
                .setApiKey(stripeSecretKey)
                .setIdempotencyKey(command.idempotencyKey())
                .build();
        Session session = Session.create(params.build(), requestOptions);
        return new CheckoutResult(session.getId(), session.getUrl());
    }
}
