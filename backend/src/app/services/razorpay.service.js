const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
    constructor() {
        // Initialize with keys from environment variables
        // User must set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
        this.instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET',
        });
    }

    /**
     * Create a Razorpay Order
     * @param {number} amount - Amount in smallest currency unit (e.g., paise for INR)
     * @param {string} currency - Currency code (default INR)
     * @param {string} receipt - Unique receipt ID
     */
    async createOrder(amount, currency = 'INR', receipt) {
        try {
            const options = {
                amount: amount, // Amount is expected in paise
                currency: currency,
                receipt: receipt,
                payment_capture: 1, // Auto capture
            };
            const order = await this.instance.orders.create(options);
            return order;
        } catch (error) {
            console.error('Razorpay Create Order Error:', error);
            throw new Error('Failed to create payment order');
        }
    }

    /**
     * Verify Payment Signature
     * @param {string} orderId - Order ID returned by createOrder
     * @param {string} paymentId - Payment ID returned by frontend success
     * @param {string} signature - Signature returned by frontend
     */
    verifySignature(orderId, paymentId, signature) {
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(orderId + '|' + paymentId)
            .digest('hex');

        return generatedSignature === signature;
    }
}

module.exports = new RazorpayService();
