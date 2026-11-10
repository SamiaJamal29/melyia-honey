interface SummaryOrder { readonly status: string; readonly totalSen: number }

export const getResellerMetrics = <Order extends SummaryOrder>({
  discountBasisPoints,
  orders,
}: {
  readonly discountBasisPoints: number;
  readonly orders: readonly Order[];
}) => ({
  activeOrders: orders.filter((order) =>
    ["placed", "packing", "shipped"].includes(order.status),
  ).length,
  completedOrderValueSen: orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + order.totalSen, 0),
  discountPercent: discountBasisPoints / 100,
});
