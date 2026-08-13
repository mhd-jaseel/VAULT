import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DrawerSection, DrawerRow, DrawerBadge } from '../AdminDetailsDrawer';

export default function ProductDetailsView({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await axios.get(`/products/${productId}`);
        if (isMounted && res.data.success) {
          setProduct(res.data.data);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (productId) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#6b7280] font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center font-mono">
        <p className="text-xs text-[#dc2626] font-bold uppercase mb-4">Unable to load details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Header / Image ── */}
      <DrawerSection>
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 bg-[#f3f4f6] rounded-xl flex items-center justify-center shrink-0 border border-[#e5e5e5] overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-[#9ca3af] font-mono">NO IMG</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[#111111] uppercase tracking-wide">{product.name}</h3>
            {product.brand && (
              <p className="text-[10px] font-mono text-[#6b7280] mt-1">{product.brand.name || product.brand}</p>
            )}
            <div className="mt-2 flex gap-2">
              <DrawerBadge variant={product.isBlocked ? 'danger' : 'success'}>
                {product.isBlocked ? 'BLOCKED' : 'ACTIVE'}
              </DrawerBadge>
              <DrawerBadge variant={product.stock > 0 ? 'info' : 'danger'}>
                {product.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
              </DrawerBadge>
            </div>
          </div>
        </div>
      </DrawerSection>

      {/* ── Pricing & Inventory ── */}
      <DrawerSection title="Pricing & Inventory">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
            <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">Price</span>
            <span className="text-sm font-bold text-[#111111] font-mono">₹{product.price?.toLocaleString('en-IN') || 0}</span>
          </div>
          <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
            <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">Stock</span>
            <span className={`text-sm font-bold font-mono ${product.stock <= 5 ? 'text-red-500' : 'text-[#111111]'}`}>
              {product.stock} units
            </span>
          </div>
        </div>
        
        {product.discountPrice > 0 && (
          <DrawerRow 
            label="Discount Price" 
            value={`₹${product.discountPrice.toLocaleString('en-IN')}`} 
          />
        )}
      </DrawerSection>

      {/* ── Organization ── */}
      <DrawerSection title="Organization">
        <DrawerRow 
          label="Category" 
          value={product.category?.name || product.category || 'Uncategorized'} 
        />
        <DrawerRow 
          label="Tags" 
          value={product.tags?.join(', ') || 'None'} 
        />
        <DrawerRow 
          label="Added On" 
          value={new Date(product.createdAt).toLocaleDateString()} 
        />
      </DrawerSection>

      {/* ── Description ── */}
      {product.description && (
        <DrawerSection title="Description">
          <p className="text-xs text-[#374151] font-sans leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>
        </DrawerSection>
      )}

    </div>
  );
}
