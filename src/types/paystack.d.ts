declare module '@paystack/inline-js' {
  export default class PaystackPop {
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      ref?: string;
      firstname?: string;
      lastname?: string;
      channels?: string[];
      metadata?: Record<string, unknown>;
      onSuccess?: (transaction: { reference: string; status: string }) => void;
      onCancel?: () => void;
    }): void;
  }
}
