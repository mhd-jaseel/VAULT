import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PremiumSwal } from '../../utils/swalHelper';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { resolveImage } from '../../utils/imageHelper';

export default function AdminCategories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form toggle states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Input states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/categories?page=${page}&limit=6`);
      if (res.data.success) {
        setCategories(res.data.data);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setIsOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditing(true);
    setCurrentId(cat._id);
    setName(cat.name);
    setDescription(cat.description || '');
    setImagePreview(cat.image ? resolveImage(cat.image) : '');
    setImageFile(null);
    setIsOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      let res;
      if (isEditing) {
        res = await axios.put(`/categories/${currentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        toast.success(isEditing ? 'Category updated successfully.' : 'Category created successfully.');
        setIsOpen(false);
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing category request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await PremiumSwal.fire({
      title: 'Delete Category?',
      text: 'Are you sure you want to delete this category?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`/categories/${id}`);
      if (res.data.success) {
        toast.success('Category deleted successfully.');
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Title */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-primary font-display">
            Manage Categories
          </h1>
          <p className="text-xs text-text-secondary mt-1">Add, update, and manage accessory category groupings.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-gold text-xs uppercase tracking-widest py-2.5 px-6 flex items-center gap-1"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl shimmer-bg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white border border-border-light rounded-2xl">
          <p className="text-xs text-text-secondary">No categories found. Click add to register a new collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="glass-card flex items-center justify-between border border-border-light p-4 hover:border-neutral-300 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center border border-border-light p-1 shadow-xs">
                  {cat.image ? (
                    <img 
                      src={resolveImage(cat.image)} 
                      alt={cat.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-neutral-400 font-bold text-xs font-mono">VAULT</span>
                  )}
                </div>
                <div 
                  onClick={() => handleOpenEdit(cat)}
                  className="cursor-pointer hover:bg-neutral-50 -mx-1 px-1 py-0.5 rounded transition-colors group"
                >
                  <h4 className="font-display font-semibold text-sm text-text-primary group-hover:text-black group-hover:underline transition-colors">{cat.name}</h4>
                  <p className="text-[10px] text-text-secondary max-w-[150px] truncate group-hover:text-neutral-700">{cat.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 border border-border-light rounded-lg text-neutral-600 hover:text-black hover:border-neutral-400 cursor-pointer transition-colors"
                  aria-label={`Edit ${cat.name}`}
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 border border-border-light rounded-lg text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 cursor-pointer transition-colors"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 size={12} />
                </button>
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
        loading={loading}
      />

      {/* Editor Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-md bg-white border border-border-light rounded-2xl shadow-xl p-6 z-10 text-text-primary">
            <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-text-primary">
                {isEditing ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-widest block mb-1 font-bold">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wallets"
                  className="form-input text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-widest block mb-1 font-bold">Description</label>
                <textarea
                  placeholder="Short description of items..."
                  className="form-input text-xs min-h-[60px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-text-secondary uppercase tracking-widest block mb-1.5 font-bold">Category Image</label>
                
                {imagePreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border-light bg-white flex items-center justify-center">
                    <img src={imagePreview} alt="" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-600 border border-red-700 text-white text-[9px] py-1 px-2.5 rounded-md cursor-pointer hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-border-light bg-neutral-50 hover:bg-neutral-100/50 hover:border-neutral-400 cursor-pointer p-4 transition-colors">
                    <Upload className="text-neutral-400 mb-1" size={20} />
                    <span className="text-[10px] font-semibold text-neutral-700">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-gold text-xs uppercase tracking-widest py-3 mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>SAVING CATEGORY...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
