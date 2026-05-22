import api from './api';

export interface BookingPaymentData {
  propertyId: string;
  propertyName: string;
  amount: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  driverEnabled?: boolean;
  arrivingTime?: string;
  leavingTime?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    checkoutUrl: string;
    flouciPaymentId: string;
    amount: number;
    currency: string;
    status: string;
  };
}

export interface TransactionStatus {
  success: boolean;
  data?: {
    transactionId: string;
    status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
    amount: number;
    currency: string;
    processedAt?: string;
    paidAt?: string;
  };
}

/**
 * Payment Service
 * Handles all payment-related API calls
 */
class PaymentService {
  /**
   * Initiate a booking payment
   * @param bookingData Booking details
   * @returns Payment checkout URL and transaction details
   */
  async initiateBookingPayment(bookingData: BookingPaymentData): Promise<PaymentResponse> {
    try {
      const response = await api.post<PaymentResponse['data']>('/payments/initiate-booking', bookingData);
      return response as unknown as PaymentResponse;
    } catch (error: any) {
      console.error('Failed to initiate booking payment:', error);
      throw error;
    }
  }

  /**
   * Check payment transaction status
   * @param transactionId Transaction ID from initiate payment response
   * @returns Transaction status
   */
  async checkTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const response = await api.get<TransactionStatus['data']>(`/payments/transactions/${transactionId}`);
      return response as unknown as TransactionStatus;
    } catch (error: any) {
      console.error('Failed to check transaction status:', error);
      throw error;
    }
  }

  /**
   * Get all my payment transactions
   * @returns List of transactions
   */
  async getMyTransactions() {
    try {
      const response = await api.get('/payments/transactions');
      return response;
    } catch (error: any) {
      console.error('Failed to get transactions:', error);
      throw error;
    }
  }

  /**
   * Initiate pack purchase payment
   * @param pack Pack type (bronze, silver, gold, platinum)
   * @returns Payment checkout URL
   */
  async initiatePackPayment(pack: 'bronze' | 'silver' | 'gold' | 'platinum') {
    try {
      const response = await api.post('/payments/initiate-pack', { pack });
      return response;
    } catch (error: any) {
      console.error('Failed to initiate pack payment:', error);
      throw error;
    }
  }

  /**
   * Initiate property boost payment
   * @param propertyId Property ID
   * @param boostPlan Boost plan (1day, 3day, 7day)
   * @returns Payment checkout URL
   */
  async initiatePropertyBoost(propertyId: string, boostPlan: '1day' | '3day' | '7day') {
    try {
      const response = await api.post(`/payments/properties/${propertyId}/initiate-boost`, {
        boostPlan,
      });
      return response;
    } catch (error: any) {
      console.error('Failed to initiate property boost:', error);
      throw error;
    }
  }
}

export default new PaymentService();
