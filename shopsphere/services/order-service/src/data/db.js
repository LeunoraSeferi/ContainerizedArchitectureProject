export const orders = [
  {
    id: 1,
    customerId: 101,
    items: [
      { productId: 1, qty: 2, unitPrice: 50 }
    ],
    status: "PENDING",
    total: 100,
    createdAt: new Date().toISOString(),
  }
];
