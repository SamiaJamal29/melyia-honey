interface MetricOrder { readonly status: string; readonly totalSen: number }
interface MetricInventory { readonly availableQuantity: number; readonly lowStockThreshold: number }
interface MetricUser { readonly isActive: boolean }

export const getAdminMetrics = <
  Order extends MetricOrder,
  Inventory extends MetricInventory,
  User extends MetricUser,
>({
  orders,
  inventory,
  users,
}: {
  readonly orders: readonly Order[];
  readonly inventory: readonly Inventory[];
  readonly users: readonly User[];
}) => ({
  activeUsers: users.filter((user) => user.isActive).length,
  grossOrderValueSen: orders.reduce((sum, order) => sum + order.totalSen, 0),
  openOrders: orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length,
  lowStockProducts: inventory.filter(
    (item) => item.availableQuantity <= item.lowStockThreshold,
  ).length,
});
