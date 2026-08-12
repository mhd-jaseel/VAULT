import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

let instance = null;

export const getRazorpayInstance = () => {
  if (!instance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials missing in environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).');
    }

    instance = new Razorpay({ key_id, key_secret });
  }
  return instance;
};

export default new Proxy({}, {
  get(target, prop) {
    const rzp = getRazorpayInstance();
    const value = rzp[prop];
    return typeof value === 'function' ? value.bind(rzp) : value;
  }
});
