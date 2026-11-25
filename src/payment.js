/* ============ Payment (domain, stub) ============
   One payment for one booking. No real money moves: PaymentGateway is a fake bank
   that waits a moment and then approves (or declines) the payment. */

export const PAYMENT_STATUS = { PENDING: "pending", PAID: "paid", FAILED: "failed", REFUNDED: "refunded", UNPAID: "unpaid" };

export const PAYMENT_METHODS = [
  { id: "card", label: "Credit / debit card", icon: "💳" },
  { id: "fpx", label: "Online banking (FPX)", icon: "🏦" },
  { id: "ewallet", label: "E-wallet", icon: "📱" },
];
export const BANKS = ["Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong Bank"];
export const WALLETS = ["Touch 'n Go eWallet", "GrabPay", "Boost", "ShopeePay"];

// Fake payment gateway. A real one would call a bank or payment provider.
// Test card: a card number ending in 0000 is declined, so the "payment failed" case can be tried.
export const PaymentGateway = {
  charge({ method, details }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const number = String(details?.number ?? "").replace(/\s/g, "");
        const declined = method === "card" && number.endsWith("0000");
        resolve(declined ? { ok: false, message: "Your card was declined. Please try another card." } : { ok: true });
      }, 1200);
    });
  },
};

// "12/27" -> "" when fine, otherwise the error text
function expiryError(text = "") {
  const m = /^(\d{2})\/(\d{2})$/.exec(text);
  if (!m || +m[1] < 1 || +m[1] > 12) return "Enter the expiry as MM/YY.";
  const firstDayAfter = new Date(2000 + +m[2], +m[1], 1); // a card works until the end of its expiry month
  return firstDayAfter <= new Date() ? "This card has expired." : "";
}

export class Payment {
  // Only the last 4 digits of a card are kept. The full number and the security code are never stored.
  constructor({ method, amount = 0, status = PAYMENT_STATUS.PENDING, detail = "", paidAt = null }) {
    this.method = method; // "card" | "fpx" | "ewallet" | "venue" (pay at the restaurant)
    this.amount = amount;
    this.status = status;
    this.detail = detail; // e.g. "ending 4242", "Maybank"
    this.paidAt = paidAt;
  }

  get methodLabel() {
    if (this.method === "venue") return "Pay at the venue";
    return PAYMENT_METHODS.find((m) => m.id === this.method)?.label ?? this.method;
  }
  get summary() { return this.detail ? `${this.methodLabel} · ${this.detail}` : this.methodLabel; }
  get statusLabel() {
    return { pending: "Pending", paid: "Paid", failed: "Payment failed", refunded: "Refunded", unpaid: "Pay at the venue" }[this.status];
  }
  get isPaid() { return this.status === PAYMENT_STATUS.PAID; }

  // Checks what the customer typed. Returns { field: "message" }, empty when everything is fine.
  static validate(method, details = {}) {
    const errors = {};
    if (method === "card") {
      if (!details.name?.trim()) errors.name = "Enter the name on the card.";
      if (!/^\d{16}$/.test((details.number ?? "").replace(/\s/g, ""))) errors.number = "Enter a 16-digit card number.";
      const expiry = expiryError(details.expiry);
      if (expiry) errors.expiry = expiry;
      if (!/^\d{3}$/.test(details.cvv ?? "")) errors.cvv = "Enter the 3-digit security code.";
    } else if (method === "fpx") {
      if (!details.bank) errors.bank = "Choose your bank.";
    } else if (method === "ewallet") {
      if (!details.wallet) errors.wallet = "Choose your e-wallet.";
    } else {
      errors.method = "Choose a payment method.";
    }
    return errors;
  }

  // Sends the payment to the gateway and records the result. Returns { ok, message? }.
  async process(details) {
    const result = await PaymentGateway.charge({ method: this.method, amount: this.amount, details });
    this.status = result.ok ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;
    if (result.ok) {
      this.paidAt = new Date().toISOString();
      this.detail = this.method === "card" ? `ending ${details.number.replace(/\s/g, "").slice(-4)}`
        : this.method === "fpx" ? details.bank : details.wallet;
    }
    return result;
  }

  // A copy with the money handed back (only a paid payment can be refunded)
  refunded() {
    return new Payment({ ...this, status: this.isPaid ? PAYMENT_STATUS.REFUNDED : this.status });
  }
}
