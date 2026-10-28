declare module "midtrans-client" {
  export interface MidtransStatusResponse {
    status_code?: string;
    transaction_status?: string;
    fraud_status?: string;
    [key: string]: unknown;
  }

  export class Snap {
    constructor(options: {
      isProduction?: boolean;
      serverKey: string;
      clientKey?: string;
    });
    createTransaction(parameter: Record<string, unknown>): Promise<{
      token: string;
      redirect_url: string;
    }>;
    transaction: {
      status(orderId: string): Promise<MidtransStatusResponse>;
    };
  }
}

interface Window {
  snap?: {
    embed: (token: string, options: Record<string, unknown>) => { hide?: () => void };
    hide?: () => void;
  };
}
