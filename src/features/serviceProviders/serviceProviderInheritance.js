// src/utils/serviceProviderInheritance.js

export const getServiceProviderLmClients = (serviceProvider) => {
  const clients = Array.isArray(serviceProvider?.clients)
    ? serviceProvider.clients
    : [];

  return clients.filter(
    (client) =>
      client?.clientType === "LM" && client?.relationshipType === "MNC",
  );
};

export const getServiceProviderParentSpClient = (serviceProvider) => {
  const clients = Array.isArray(serviceProvider?.clients)
    ? serviceProvider.clients
    : [];

  return (
    clients.find(
      (client) =>
        client?.clientType === "SP" && client?.relationshipType === "SUBC",
    ) || null
  );
};

export const resolveServiceProviderWorkbases = (
  serviceProviderId,
  allServiceProviders = [],
  visitedIds = new Set(),
) => {
  if (!serviceProviderId) return [];

  if (visitedIds.has(serviceProviderId)) {
    console.warn(
      "resolveServiceProviderWorkbases -- circular relationship detected",
      serviceProviderId,
    );
    return [];
  }

  visitedIds.add(serviceProviderId);

  const serviceProvider = allServiceProviders.find(
    (item) => item?.id === serviceProviderId,
  );

  if (!serviceProvider) return [];

  const lmClients = getServiceProviderLmClients(serviceProvider);

  if (lmClients.length > 0) {
    return lmClients
      .map((client) => ({
        id: client?.id || "NAv",
        name: client?.name || "NAv",
      }))
      .filter((item) => item?.id !== "NAv");
  }

  const parentSpClient = getServiceProviderParentSpClient(serviceProvider);

  if (!parentSpClient?.id || parentSpClient?.id === "NAv") {
    return [];
  }

  return resolveServiceProviderWorkbases(
    parentSpClient.id,
    allServiceProviders,
    visitedIds,
  );
};
