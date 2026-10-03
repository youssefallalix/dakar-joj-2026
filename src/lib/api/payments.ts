import { apiRequest } from "../apiClient";

export type Subscription = {
  userId: string;
  email?: string | null;
  plan: string;
  status: "active" | "canceled" | "pending";
  updatedAt?: string;
};

export async function getMySubscription() {
  const response = await apiRequest<{ success: true; data: Subscription }>("/api/v2/payments/me");
  return response.data;
}

export async function confirmPayment(token: string) {
  const response = await apiRequest<{ success: true; data: { status: string; plan: string } }>("/api/v2/payments/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  return response.data;
}

export async function createPaymentCheckout(plan: string) {
  const response = await apiRequest<{ success: true; data: { checkoutUrl: string } }>("/api/v2/payments/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
  return response.data;
}

export async function cancelMySubscription() {
  const response = await apiRequest<{ success: true; data: Subscription }>("/api/v2/payments/cancel", { method: "POST" });
  return response.data;
}

export async function listSubscriptions() {
  const response = await apiRequest<{ success: true; data: Subscription[] }>("/api/v2/payments/admin");
  return response.data;
}

export async function updateSubscription(userId: string, plan: string, status: "active" | "canceled") {
  const response = await apiRequest<{ success: true; data: Subscription }>(`/api/v2/payments/admin/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ plan, status }),
  });
  return response.data;
}