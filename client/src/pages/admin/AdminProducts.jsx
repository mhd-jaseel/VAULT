import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Edit2, Trash2, X, Upload, Star } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal toggle states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Image handling
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/products?page=${page}&limit=10`);
      if (res.data.success) {
        setProducts(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get('/brands');
      if (res.data.success) setBrands(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  // Open modal for editing if queried in URL (e.g. from Restock button in dashboard)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const prod = products.find((p) => p._id === editId);
      if (prod) handleOpenEdit(prod);
    }
  }, [searchParams, products]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    setDescription('');
    setPrice('');
    setCategory(categories[0]?._id || '');
    setBrand(brands[0]?._id || '');
    setStock('');
    setIsFeatured(false);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setIsOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setIsEditing(true);
    setCurrentId(prod._id);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(prod.price);
    setCategory(prod.category?._id || '');
    setBrand(prod.brand?._id || prod.brand || '');
    setStock(prod.stock);
    setIsFeatured(prod.isFeatured || false);
    setExistingImages(prod.images || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setIsOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles((prev) => [...prev, ...files]);
    
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (path) => {
    setExistingImages((prev) => prev.filter((img) => img !== path));
  };

  const handleRemoveNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExisting = (index, direction) => {
    const updated = [...existingImages];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setExistingImages(updated);
  };

  const handleMoveNew = (index, direction) => {
    const updatedFiles = [...newImageFiles];
    const updatedPreviews = [...newImagePreviews];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updatedFiles.length) return;

    const tempFile = updatedFiles[index];
    updatedFiles[index] = updatedFiles[newIndex];
    updatedFiles[newIndex] = tempFile;

    const tempPreview = updatedPreviews[index];
    updatedPreviews[index] = updatedPreviews[newIndex];
    updatedPreviews[newIndex] = tempPreview;

    setNewImageFiles(updatedFiles);
    setNewImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !price || !category || !brand || stock === '') {
      toast.warning('Please fill out all required fields.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('brandId', brand);
      formData.append('stock', stock);
      formData.append('isFeatured', isFeatured);

      if (isEditing) {
        // Send array of retained image paths as JSON string
        formData.append('keepImages', JSON.stringify(existingImages));
      }

      newImageFiles.forEach((file) => {
        formData.append('images', file);
      });

      let res;
      if (isEditing) {
        res = await axios.put(`/products/${currentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        toast.success(isEditing ? 'Product updated successfully.' : 'Product created successfully.');
        setIsOpen(false);
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing product.');
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Product?',
      text: 'Are you sure you want to remove this product from the inventory?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`/products/${id}`);
      if (res.data.success) {
        toast.success('Product deleted successfully.');
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white font-display">
            Manage Products
          </h1>
          <p className="text-xs text-gray-500 mt-1">Configure luxury watch, wallet, belt, and jewelry stocks.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-gold text-xs uppercase tracking-widest py-2.5 px-6 flex items-center gap-1"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 shimmer-bg rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl">
          <p className="text-xs text-zinc-500">No accessories registered. Click Add to create a product catalog item.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-dark-card border border-dark-border rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-dark-border text-zinc-500 uppercase font-display tracking-wider bg-black/40">
                <th className="p-4">Product Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4">Featured</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod._id} className="border-b border-dark-border/40 hover:bg-zinc-900/10">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0 flex items-center justify-center border border-dark-border">
                        {prod.images && prod.images.length > 0 ? (
                          <img 
                            src={`http://localhost:5000${prod.images[0]}`} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-zinc-800 font-bold text-[10px]">VAULT</span>
                        )}
                      </div>
                      <span className="font-semibold text-white truncate max-w-[150px]">{prod.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 font-medium">
                    {prod.category?.name || 'Unassigned'}
                  </td>
                  <td className="p-4 text-gold font-bold">
                    ₹{prod.price.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    {prod.stock === 0 ? (
                      <span className="text-red-400 font-semibold bg-red-950/25 border border-red-950/50 py-0.5 px-2 rounded-full">Out of stock</span>
                    ) : prod.stock < 5 ? (
                      <span className="text-orange-400 font-semibold bg-orange-950/25 border border-orange-950/50 py-0.5 px-2 rounded-full">Low Stock ({prod.stock})</span>
                    ) : (
                      <span className="text-green-400 font-semibold bg-green-950/20 border border-green-950/30 py-0.5 px-2 rounded-full">{prod.stock} Units</span>
                    )}
                  </td>
                  <td className="p-4">
                    {prod.isFeatured ? (
                      <span className="text-gold font-semibold flex items-center gap-0.5"><Star size={12} fill="currentColor" /> Yes</span>
                    ) : (
                      <span className="text-zinc-500">No</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-2 border border-zinc-800 rounded-lg text-gray-400 hover:text-gold hover:border-gold/30 cursor-pointer"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(prod._id)}
                        className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 hover:border-red-950/40 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        onPageChange={(newPage) => setSearchParams({ page: newPage })}
        loading={loading}
      />

      {/* Editor Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-xl bg-dark-card border border-dark-border rounded-2xl shadow-xl p-6 z-10 text-gray-200">
            <div className="flex items-center justify-between border-b border-dark-border pb-3 mb-4">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-white">
                {isEditing ? 'Modify Product' : 'Add Product'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Product Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Minimalist Gold Chain"
                    className="form-input text-xs"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Category selector */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Category</label>
                  <select
                    className="form-input text-xs cursor-pointer !py-2.5"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand selector */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Brand</label>
                  <select
                    className="form-input text-xs cursor-pointer !py-2.5"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="MRP price"
                    className="form-input text-xs"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Stock Count</label>
                  <input
                    type="number"
                    placeholder="Quantity in vault"
                    className="form-input text-xs"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>

                {/* Featured checkbox */}
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="featured_chk"
                    className="w-4 h-4 accent-gold cursor-pointer"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <label htmlFor="featured_chk" className="text-xs text-zinc-300 font-medium cursor-pointer">
                    Feature on Homepage
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Detailed Description</label>
                <textarea
                  placeholder="Material specs, sizing details, packaging..."
                  className="form-input text-xs min-h-[70px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Images */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">Product Images</label>
                
                {/* Images grid preview */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {/* Existing Images */}
                  {existingImages.map((img, i) => (
                    <div key={`exist-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-black border border-dark-border">
                      <img src={`http://localhost:5000${img}`} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img)}
                        className="absolute -top-1 -right-1 bg-red-900 border border-red-500 text-white rounded-full p-0.5 cursor-pointer z-10"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between bg-black/70 rounded px-1 py-0.5 z-10">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => handleMoveExisting(i, -1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ◀
                        </button>
                        <span className="text-[7px] text-zinc-500 self-center">#{i+1}</span>
                        <button
                          type="button"
                          disabled={i === existingImages.length - 1}
                          onClick={() => handleMoveExisting(i, 1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* New Image Previews */}
                  {newImagePreviews.map((preview, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-black border border-dark-border">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        className="absolute -top-1 -right-1 bg-red-955 border border-red-500 text-white rounded-full p-0.5 cursor-pointer z-10"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between bg-black/70 rounded px-1 py-0.5 z-10">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveNew(idx, -1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ◀
                        </button>
                        <span className="text-[7px] text-zinc-500 self-center">#{idx+1}</span>
                        <button
                          type="button"
                          disabled={idx === newImageFiles.length - 1}
                          onClick={() => handleMoveNew(idx, 1)}
                          className="text-[8px] hover:text-gold disabled:opacity-30 cursor-pointer text-zinc-400"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  <label className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-dark-border bg-dark-input hover:border-gold/40 cursor-pointer p-1.5">
                    <Upload className="text-zinc-500" size={16} />
                    <span className="text-[8px] font-semibold text-gray-400 mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-gold text-xs uppercase tracking-widest py-3 mt-4"
              >
                {isEditing ? 'Save Product Details' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
