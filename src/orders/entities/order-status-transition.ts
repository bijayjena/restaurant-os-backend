import { OrderStatus } from '../../entities/order.entity';

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}
