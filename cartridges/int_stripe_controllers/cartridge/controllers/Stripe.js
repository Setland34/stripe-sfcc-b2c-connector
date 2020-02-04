'use strict';

/**
 * Entry point for processing webhooks push notifications.
 */
function webHook() {
    const webhooksHelper = require('int_stripe_core').getWebhooksHelper();
    webhooksHelper.processIncomingNotification();
}

exports.WebHook = webHook;
exports.WebHook.public = true;

/**
 * Handle Payment request button action
 */
function paymentRequestButtonHandler() {
    // v1
    // eslint-disable-next-line no-unused-vars
    const payload = JSON.parse(request.httpParameterMap.requestBodyAsString);
}

exports.PaymentRequestButtonHandler = paymentRequestButtonHandler;
exports.PaymentRequestButtonHandler.public = true;

/**
 * Return shipping options used for payment request button
 */
function getShippingOptions() {
    // v1
    // eslint-disable-next-line no-unused-vars
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
}

exports.GetShippingOptions = getShippingOptions;
exports.GetShippingOptions.public = true;
