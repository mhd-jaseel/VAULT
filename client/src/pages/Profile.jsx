import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import axios from 'axios';
import { User, ClipboardList, MapPin, CheckCircle, ChevronRight, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'profile'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  // Form handling
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=profile');
    }
  }, [user]);

  // Load user details into form
  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('phone', user.phone || '');
      if (user.address) {
        setValue('street', user.address.street || '');
        setValue('city', user.address.city || '');
        setValue('state', user.address.state || '');
        setValue('zip', user.address.zip || '');
      }
    }
  }, [user, setValue]);

  // Fetch orders
  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      axios.get(`/orders/myorders?page=${page}&limit=5`)
        .then((res) => {
          if (res.data.success) {
            setOrders(res.data.data);
            setPages(res.data.pages || 1);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingOrders(false));
    }
  }, [user, page]);

  const onProfileUpdate = async (data) => {
    setUpdating(true);
    setUpdateSuccess('');
    setUpdateError('');

    const payload = {
      name: data.name,
      phone: data.phone,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
      }
    };

    if (data.newPassword) {
      payload.password = data.newPassword;
    }

    const res = await updateProfile(payload);
    setUpdating(false);

    if (res.success) {
      toast.success('Profile coordinates updated successfully!');
      setUpdateSuccess('Profile coordinates updated successfully!');
      setValue('newPassword', ''); // clear input
    } else {
      toast.error(res.message || 'Failed to update profile.');
      setUpdateError(res.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Profile Header card */}
      <div className="glass-card mb-8 flex items-center justify-between border border-border-light bg-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xl uppercase font-sans">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wide">{user.name}</h2>
            <p className="text-xs text-text-secondary">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase font-bold tracking-wider text-text-primary bg-neutral-100 px-3 py-1 rounded-full border border-border-light font-mono">
            {user.role}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-sans font-bold tracking-widest uppercase transition-all duration-200 active:scale-[0.98] cursor-pointer"
            aria-label="Logout account"
          >
            <LogOut size={11} /> LOGOUT
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-light mb-6 gap-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === 'orders' 
              ? 'border-brand-primary text-text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-1.5"><ClipboardList size={14} /> MY ORDERS</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === 'profile' 
              ? 'border-brand-primary text-text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-1.5"><User size={14} /> EDIT PROFILE</span>
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl shimmer-bg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-border-light rounded-2xl">
              <ClipboardList className="text-text-secondary mb-3 stroke-1" size={40} />
              <h3 className="font-bold text-sm text-text-primary uppercase tracking-wide">No Orders Placed</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
                You haven't purchased premium accessories yet. Browse the catalog to order.
              </p>
              <Link to="/shop" className="btn-gold text-[10px] py-2.5 px-6 mt-4 uppercase tracking-widest">
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div 
                  key={ord._id}
                  className="glass-card border border-border-light hover:border-text-primary transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">
                        Order #{ord._id.toString().slice(-6).toUpperCase()}
                      </h4>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ord.status === 'delivered' 
                          ? 'bg-[#e6f7ee] border-[#e6f7ee] text-[#16a34a]' 
                          : ord.status === 'cancelled' 
                          ? 'bg-red-50 border-red-100 text-red-600' 
                          : 'bg-neutral-100 border-border-light text-text-primary'
                      }`}>
                        {ord.status}
                      </span>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ord.paymentStatus === 'verified' 
                          ? 'bg-[#e6f7ee] border-[#e6f7ee] text-[#16a34a]' 
                          : ord.paymentStatus === 'rejected'
                          ? 'bg-red-50 border-red-100 text-red-600' 
                          : 'bg-neutral-100 border-border-light text-text-secondary'
                      }`}>
                        Payment: {ord.paymentStatus}
                      </span>
                    </div>
                    <p className="text-[9px] text-text-secondary font-mono">
                      Placed on {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-text-primary font-bold font-mono">
                      ₹{ord.grandTotal.toLocaleString('en-IN')} for {ord.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {/* If payment failed, allow the customer to go back to checkout */}
                    {ord.paymentStatus === 'failed' && (
                      <Link
                        to="/checkout"
                        className="btn-gold !py-2 !px-4 text-[9px] uppercase tracking-wider text-center"
                      >
                        Retry Payment
                      </Link>
                    )}
                    <Link
                      to={`/order-tracking/${ord._id}`}
                      className="btn-dark !py-2 !px-4 text-[9px] uppercase tracking-wider text-center flex items-center justify-center gap-1"
                    >
                      Track Order <ChevronRight size={10} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination 
            page={page} 
            pages={pages} 
            onPageChange={(newPage) => setSearchParams({ page: newPage })} 
            loading={loadingOrders} 
          />
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit(onProfileUpdate)} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Profile details */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Personal Information
            </h3>

            {updateSuccess && <p className="text-[10px] text-[#16a34a] font-bold font-mono uppercase">{updateSuccess}</p>}
            {updateError && <p className="text-[10px] text-red-500 font-bold font-mono uppercase">{updateError}</p>}

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Full Name</label>
              <input
                type="text"
                className="form-input text-xs"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.name.message}</span>}
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Mobile Number</label>
              <input
                type="text"
                className="form-input text-xs"
                {...register('phone')}
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Change Password (Optional)</label>
              <input
                type="password"
                placeholder="Leave blank to keep current"
                className="form-input text-xs font-mono"
                {...register('newPassword', { minLength: { value: 6, message: 'Password must be 6 characters' } })}
              />
              {errors.newPassword && <span className="text-[9px] text-red-500 mt-1 block font-mono font-bold">{errors.newPassword.message}</span>}
            </div>
          </div>

          {/* Address coordinates */}
          <div className="glass-card flex flex-col gap-4">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3">
              Default Shipping Address
            </h3>

            <div>
              <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">Street Address</label>
              <input
                type="text"
                placeholder="Apartment, building, street coordinates"
                className="form-input text-xs"
                {...register('street')}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  className="form-input text-xs"
                  {...register('city')}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">State</label>
                <input
                  type="text"
                  placeholder="State"
                  className="form-input text-xs"
                  {...register('state')}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-text-secondary uppercase block mb-1">ZIP Code</label>
                <input
                  type="text"
                  placeholder="Zip"
                  className="form-input text-xs font-mono"
                  {...register('zip')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="btn-gold text-[10px] py-3.5 mt-4"
            >
              {updating ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>SAVE CHANGES <CheckCircle size={14} /></>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
