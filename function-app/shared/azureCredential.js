const { DefaultAzureCredential, ManagedIdentityCredential } = require('@azure/identity');

function createAzureCredential() {
  if (process.env.NODE_ENV === 'development') {
    return new DefaultAzureCredential();
  }

  return process.env.AZURE_CLIENT_ID
    ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
    : new ManagedIdentityCredential();
}

module.exports = createAzureCredential;
