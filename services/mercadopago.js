const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

module.exports = {
  payment: new Payment(client),
  preference: new Preference(client)
};