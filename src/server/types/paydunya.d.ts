declare module "paydunya" {
  export class Setup {
    constructor(options?: { masterKey?: string; privateKey?: string; publicKey?: string; token?: string; mode?: string });
  }
  export class Store {
    constructor(options: { name: string; returnURL?: string; cancelURL?: string; callbackURL?: string });
  }
  export class CheckoutInvoice {
    constructor(setup: Setup, store: Store);
    totalAmount: number;
    description: string;
    status?: string;
    token?: string;
    url?: string;
    addItem(name: string, quantity: number, unitPrice: number, totalPrice: number): void;
    addCustomData(title: string, value: string): void;
    create(): Promise<void>;
    confirm(token?: string): Promise<void>;
  }
}