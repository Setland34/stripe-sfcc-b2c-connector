/* eslint-disable no-param-reassign */
/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
/* globals PIPELET_NEXT */
// v1
/**
*   @output JSONPayload : String
*/

const stripePaymentsHelper = require('int_stripe_core/cartridge/scripts/stripe/helpers/controllers/stripePaymentsHelper');


function execute(args) {
    args.JSONPayload = JSON.stringify(stripePaymentsHelper.BeforePaymentAuthorization());

    return PIPELET_NEXT;
}
