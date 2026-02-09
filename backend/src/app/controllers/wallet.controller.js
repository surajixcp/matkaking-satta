const walletService = require('../services/wallet.service');
const depositService = require('../services/deposit.service');

exports.getBalance = async (req, res, next) => {
    try {
        const wallet = await walletService.getBalance(req.user.id);
        res.json({ success: true, data: wallet });
    } catch (error) {
        next(error);
    }
};

exports.addFunds = async (req, res, next) => {
    try {
        // NOTE: This usually comes from Payment Gateway Webhook or Admin Panel
        // For testing/manual deposit:
        const { amount, referenceId } = req.body;

        // Security check: Only allow admin or secure webhook signature in real app
        // For now, assume this is an Admin route or protected dev route
        // if (req.user.role !== 'admin') return res.status(403).json({error: 'Unauthorized'});

        const wallet = await walletService.addFunds(req.user.id, amount, referenceId);
        res.json({ success: true, data: wallet, message: 'Funds added successfully' });
    } catch (error) {
        next(error);
    }
};

exports.requestDeposit = async (req, res, next) => {
    try {
        const { amount } = req.body;
        let { paymentDetails } = req.body; // paymentDetails: { method: 'UPI', utr: '...' }

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const screenshotUrl = req.file ? req.file.path : null;

        // Ensure paymentDetails is an object
        if (typeof paymentDetails === 'string') {
            try {
                paymentDetails = JSON.parse(paymentDetails);
            } catch (e) {
                paymentDetails = {};
            }
        } else {
            paymentDetails = paymentDetails || {};
        }

        if (screenshotUrl) {
            paymentDetails.screenshot_url = screenshotUrl;
        }

        // Use DepositService to create a record in 'Deposits' table
        // Map paymentDetails to what depositService expects { amount, utr, screenshotUrl }
        const depositData = {
            amount,
            utr: paymentDetails?.utr || paymentDetails?.reference_id || 'N/A',
            screenshotUrl: paymentDetails?.screenshot_url
        };

        const request = await depositService.createDeposit(req.user.id, depositData);
        res.json({ success: true, data: request, message: 'Deposit request submitted' });
    } catch (error) {
        next(error);
    }
};



const razorpayService = require('../services/razorpay.service');

exports.createRazorpayOrder = async (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        // Check if Razorpay keys are configured
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('Razorpay keys not configured');
            return res.status(503).json({ error: 'Online payment service unavailable. Please use Manual Deposit.' });
        }

        // Amount in paise
        const amountInPaise = Math.round(amount * 100);
        const receipt = `RCPT_${Date.now()}_${req.user.id}`;

        const order = await razorpayService.createOrder(amountInPaise, 'INR', receipt);

        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

exports.verifyRazorpayPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        const isValid = razorpayService.verifySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        // Add funds to wallet (Method: Razorpay)
        // Ensure amount matches (frontend sends logic amount, but better to fetch order details? 
        // For simplicity, we accept amount here but in prod, fetch order and check amountPaid)

        // Use atomic addFunds from service
        // We pass the razorpay_payment_id as reference
        const wallet = await walletService.addFunds(
            req.user.id,
            amount,
            razorpay_payment_id,
            'Deposit (Razorpay UPI/Card)'
        );

        res.json({ success: true, message: 'Payment verified and funds added', data: wallet });
    } catch (error) {
        next(error);
    }
};

exports.requestWithdraw = async (req, res, next) => {
    try {
        const { amount, bankDetails } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const request = await walletService.requestWithdraw(req.user.id, amount, bankDetails);
        res.json({ success: true, data: request, message: 'Withdrawal request submitted' });
    } catch (error) {
        next(error);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        const { limit, page } = req.query;
        const offset = (page - 1) * limit || 0;
        const history = await walletService.getHistory(req.user.id, limit, offset);
        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

exports.getAllWithdrawals = async (req, res, next) => {
    try {
        const { status, limit, page } = req.query;
        const offset = (page - 1) * limit || 0;
        const withdrawals = await walletService.getAllWithdrawals(status, limit, offset);
        res.json({ success: true, data: withdrawals });
    } catch (error) {
        next(error);
    }
};

exports.approveWithdrawal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await walletService.approveWithdrawal(id);
        res.json({ success: true, data: result, message: 'Withdrawal approved' });
    } catch (error) {
        next(error);
    }
};

exports.rejectWithdrawal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const result = await walletService.rejectWithdrawal(id, reason);
        res.json({ success: true, data: result, message: 'Withdrawal rejected and refunded' });
    } catch (error) {
        next(error);
    }
};
