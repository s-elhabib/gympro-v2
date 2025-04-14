import { parseISO, isBefore, addDays } from 'date-fns';
import { Payment, PaymentWithDisplayStatus, DisplayPaymentStatus } from '../../types';

/**
 * Calculates the display status of a payment based on its database status and due date
 * This separates the display logic from the database status
 */
export const getDisplayStatus = (payment: Payment): DisplayPaymentStatus => {
  const today = new Date();
  const dueDate = parseISO(payment.due_date);
  
  // Database status takes precedence for certain statuses
  if (payment.status === "paid" || payment.status === "cancelled") {
    return payment.status;
  }
  
  // Calculated status for display purposes
  if (payment.status === "pending") {
    if (isBefore(dueDate, today)) {
      return "overdue";
    }
    if (isBefore(dueDate, addDays(today, 7))) {
      return "near_overdue";
    }
  }
  
  return payment.status;
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
