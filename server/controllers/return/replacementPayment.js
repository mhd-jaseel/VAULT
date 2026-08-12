import crypto from 'crypto';
import Return from '../../models/Return.js';
import razorpay from '../../services/razorpayService.js';

// POST /api/returns/:id/pay-difference
export const createReplacementPaymentOrder = async (req, res) => {
  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) return res.status(404).json({ success: false, message: 'Return record not found.' });

    if (returnRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (returnRecord.returnType !== 'replacement' || returnRecord.additionalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No additional payment required for this return.' });
    }

    if (returnRecord.replacementPaymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'Additional payment has already been completed.' });
    }

    const diffPaise = Math.round(returnRecord.additionalAmount * 100);

    const rpOrderOptions = {
      amount: diffPaise,
      currency: 'INR',
      receipt: `ret_diff_${returnRecord.returnId}`,
      notes: {
        payment_purpose: 'REPLACEMENT_DIFFERENCE',
        return_id: String(returnRecord._id),
        return_code: returnRecord.returnId,
        customer_id: String(req.user._id),
      },
    };

    const rpOrder = await razorpay.orders.create(rpOrderOptions);

    returnRecord.razorpayOrderId = rpOrder.id;
    await returnRecord.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId: rpOrder.id,
        amount: diffPaise,
        additionalAmount: returnRecord.additionalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        returnId: String(returnRecord._id),
      },
    });
  } catch (error) {
    console.error('[VAULT] createReplacementPaymentOrder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/returns/:id/verify-difference
export const verifyReplacementPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment signature data.' });
  }

  try {
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) return res.status(404).json({ success: false, message: 'Return record not found.' });

    if (returnRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const storedRazorpayOrderId = returnRecord.razorpayOrderId;
    if (!storedRazorpayOrderId) {
      return res.status(400).json({ success: false, message: 'No Razorpay order linked to this return.' });
    }

    // HMAC Signature Check
    const body = storedRazorpayOrderId + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const sigBuffer = Buffer.from(razorpay_signature, 'hex');
    const expBuffer = Buffer.from(expectedSignature, 'hex');

    let isSignatureValid = false;
    try {
      isSignatureValid = sigBuffer.length === expBuffer.length && crypto.timingSafeEqual(sigBuffer, expBuffer);
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      returnRecord.replacementPaymentStatus = 'FAILED';
      returnRecord.timeline.push({
        status: returnRecord.status,
        note: 'Replacement additional payment signature verification failed.',
      });
      await returnRecord.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    returnRecord.razorpayPaymentId = razorpay_payment_id;
    returnRecord.replacementPaymentStatus = 'PAID';
    returnRecord.timeline.push({
      status: returnRecord.status,
      note: `Additional payment of ₹${returnRecord.additionalAmount} verified successfully. Razorpay TXN: ${razorpay_payment_id}`,
    });

    await returnRecord.save();

    res.json({
      success: true,
      message: 'Additional payment verified. Replacement request confirmed.',
      data: returnRecord,
    });
  } catch (error) {
    console.error('[VAULT] verifyReplacementPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
