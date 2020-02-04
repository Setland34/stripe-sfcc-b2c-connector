'use strict';

const Logger = require('dw/system/Logger').getLogger('Stripe', 'stripe');
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
const Order = require('dw/order/Order');

/**
 * A hook to authorize credit/debit card payments.
 *
 * TODO: Payments for cards enrolled for 3DS will fail. Check if that can
 * be suppressed, and if PaymentIntents API can be used instead.
 *
 * @param {dw.order.Order} order - Order for which payment authorization needs
 *   to be processed.
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - Payment instrument
 *   to obtain authorization for.
 * @param {string} cvc - CVC code entered in CSC - this value is not passed
 *   as part of paymentInstrument object, which contains the remaining card
 *   details.
 * @return {sw.system.Status} - Status of the authorization, Status.OK should be
 *   returned only if it succeeded.
 */
exports.authorizeCreditCard = function (order, paymentInstrument, cvc) {
    Logger.debug('authorizeCreditCard hook invoked, order: ' + order + ', paymentinstrument: ' + paymentInstrument);

    try {
        const amount = paymentInstrument.paymentTransaction.amount;
        if (!amount.available) {
            throw new Error('paymentInstrument.amount not available');
        }

        var currentCurency = dw.util.Currency.getCurrency(amount.currencyCode);
        var multiplier = Math.pow(10, currentCurency.getDefaultFractionDigits());
        var orderAmount = Math.round(amount.value * multiplier);

        const stripe = require('int_stripe_core').getStripeService();

        var address = order.getBillingAddress();
        var billingDetails = {
            address: {
                city: address.city,
                country: address.countryCode.value,
                line1: address.address1,
                postal_code: address.postalCode,
                state: address.stateCode ? address.stateCode.value : ''
            }
        };

        if (order.customerEmail) {
            billingDetails.email = order.customerEmail;
        }
        if (address.fullName) {
            billingDetails.name = address.fullName;
        }
        if (address.phone) {
            billingDetails.phone = address.phone;
        }


        const paymentMethod = stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: paymentInstrument.creditCardNumber,
                exp_month: paymentInstrument.creditCardExpirationMonth,
                exp_year: paymentInstrument.creditCardExpirationYear,
                cvc: cvc
            },
            billing_details: billingDetails
        });

        const paymentIntent = stripe.paymentIntents.create({
            amount: orderAmount,
            currency: amount.currencyCode.toLowerCase(),
            payment_method: paymentMethod.id,
            description: 'MOTO transacion',
            metadata: {
                order_id: order.orderNo,
                site_id: dw.system.Site.getCurrent().getID()
            },
            confirm: true,
            payment_method_options: { card: { moto: true } }
        });

        if (paymentIntent.status === 'succeeded') {
            Transaction.wrap(function () {
                order.custom.stripePaymentIntentID = paymentIntent.id; // eslint-disable-line
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            });
        } else {
            throw new Error('Transaction auhtorization was not successful');
        }
    } catch (e) {
        var m = e.message;
        if (e.callResult) {
            var o = JSON.parse(e.callResult.errorMessage);
            m = o.error.message;
        }
        Logger.error('Error: {0}', e.message);
        return new Status(Status.ERROR, m);
    }

    return new Status(Status.OK);
};

/**
 * A hook to authorize all payment methods other than credit/debit card.
 *
 * TODO: Check if the alternative payment methods can be supported.
 * Hosted payment page is not to be supported by the cartridge. The following
 * page gives details as to how to customize it if it is ever to
 * be added:
 * https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FCustomerServiceCenter%2FConfiguringAHostedPaymentPage.html&cp=0_10_12_0
 *
 * @param {dw.order.Order} order - Order for which payment authorization needs
 *   to be processed.
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - Payment instrument
 *   to obtain authorization for.
 * @return {sw.system.Status} - Status of the authorization, Status.OK should be
 *   returned only if it succeeded.
 */
exports.authorize = function (order, paymentInstrument) { // eslint-disable-line
    return new Status(Status.ERROR, 'Not supported');
};
