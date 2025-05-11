import { parseISO, isBefore, addDays } from 'date-fns';
import { Payment, PaymentWithDisplayStatus, DisplayPaymentStatus } from '../../types';

/**
 * Calculates the display status of a payment based on its database status and due date
 * This separates the display logic from the database status
 */
export const getDisplayStatus = (payment: Payment): DisplayPaymentStatus => {
  const today = new Date();
  const dueDate = parseISO(payment.due_date);

  // Database status takes precedence only for cancelled status
  if (payment.status === "cancelled") {
    return payment.status;
  }

  // For all other statuses, calculate based on due date
  // 1. If due date has passed, status is overdue
  if (isBefore(dueDate, today)) {
    return "overdue";
  }

  // 2. If due date is within 7 days, status is near_overdue
  if (isBefore(dueDate, addDays(today, 7))) {
    return "near_overdue";
  }

  // 3. If due date is more than 7 days away, status is paid
  return "paid";
};

/**
 * Enhances a payment object with a displayStatus property
 */
export const enhancePaymentWithDisplayStatus = (payment: Payment): PaymentWithDisplayStatus => {
  return {
    ...payment,
    displayStatus: getDisplayStatus(payment)
  };
};

/**
 * Gets the CSS class for a payment status badge
 */
export const getStatusColor = (status: DisplayPaymentStatus): string => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    case "near_overdue":
      return "bg-orange-100 text-orange-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Calculates days difference between today and a due date
 */
export const getDaysDifference = (dueDate: string): number => {
  const today = new Date();
  const due = parseISO(dueDate);
  return Math.abs(Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
};

/**
 * Translates a payment status to French
 */
export const translateStatus = (status: DisplayPaymentStatus): string => {
  switch (status) {
    case "paid":
      return "Payé";
    case "pending":
      return "En Attente";
    case "overdue":
      return "En Retard";
    case "near_overdue":
      return "Échéance Proche";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
};

/**
 * Translates a payment method to French
 */
export const translatePaymentMethod = (method: string): string => {
  switch (method) {
    case "cash":
      return "Espèces";
    case "credit_card":
      return "Carte de Crédit";
    case "debit_card":
      return "Carte de Débit";
    case "bank_transfer":
      return "Virement Bancaire";
    default:
      return "Autre";
  }
};
