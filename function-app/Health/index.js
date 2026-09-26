module.exports = async function (context) {
  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      status: 'UP',
      service: 'salesforce-purchase-order-ingest',
      timestamp: new Date().toISOString()
    }
  };
};
