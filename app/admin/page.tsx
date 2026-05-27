"use client";

import { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { FaBoxOpen, FaCommentDots, FaBox, FaCogs, FaChartLine, FaSearch, FaPlus, FaEdit, FaTrash, FaTimes, FaImage, FaDatabase } from "react-icons/fa";
import toast from "react-hot-toast";
import { dummyProducts } from "@/lib/products";

// --- Types ---
interface ProductData {
  id?: string;
  name: string;
  category: string;
  technology: string;
  priceRange: string;
  priceRangeText: string;
  description: string;
  image: string;
  specs: Record<string, string>;
}

// --- Main Component ---
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: FaChartLine },
    { id: "products", label: "Products", icon: FaBox },
    { id: "orders", label: "Orders", icon: FaBoxOpen },
    { id: "customOrders", label: "Custom Orders", icon: FaCogs },
    { id: "enquiries", label: "Enquiries", icon: FaCommentDots },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background flex flex-col md:flex-row pt-20">
        
        {/* Sidebar Desktop / Top Tabs Mobile */}
        <aside className="w-full md:w-64 bg-[#111111] border-r border-white/5 md:min-h-[calc(100vh-80px)] p-6 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible z-10 sticky top-20">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-primary text-background shadow-[0_0_15px_rgba(212,168,83,0.3)]" 
                  : "text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="text-xl" />
              <span className="hidden md:inline uppercase text-sm">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "dashboard" && <TabDashboard />}
              {activeTab === "products" && <TabProducts />}
              {activeTab === "orders" && <TabOrders />}
              {activeTab === "customOrders" && <TabCustomOrders />}
              {activeTab === "enquiries" && <TabEnquiries />}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </AdminGuard>
  );
}

// --- TAB COMPONENTS ---

function TabDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, customOrders: 0, newEnquiries: 0 });
  const [seeding, setSeeding] = useState(false);

  const fetchStats = async () => {
    try {
      const [prodSnap, ordSnap, custSnap, enqSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "customOrders")),
        getDocs(collection(db, "enquiries"))
      ]);

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newEnqCount = enqSnap.docs.filter(d => {
        const ca = d.data().createdAt as Timestamp;
        return ca && ca.toMillis() > oneWeekAgo;
      }).length;

      setStats({
        products: prodSnap.size,
        orders: ordSnap.size,
        customOrders: custSnap.docs.filter(d => d.data().status === "pending" || d.data().status === "Received").length,
        newEnquiries: newEnqCount
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeed = async () => {
    if (confirm("This will seed the Firestore products collection with standard dummy products. Existing products with matching IDs will be overwritten. Continue?")) {
      setSeeding(true);
      try {
        for (const p of dummyProducts) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...data } = p;
          await setDoc(doc(db, "products", p.id), data);
        }
        toast.success("Successfully seeded 8 products!");
        fetchStats();
      } catch (e) {
        console.error("Error seeding products:", e);
        toast.error("Failed to seed database.");
      } finally {
        setSeeding(false);
      }
    }
  };

  const STAT_CARDS = [
    { title: "Total Products", value: stats.products, icon: FaBox },
    { title: "Total Orders", value: stats.orders, icon: FaBoxOpen },
    { title: "Pending Custom Orders", value: stats.customOrders, icon: FaCogs },
    { title: "New Enquiries (7d)", value: stats.newEnquiries, icon: FaCommentDots },
  ];

  return (
    <div>
      <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-8">System Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {STAT_CARDS.map(card => (
          <div key={card.title} className="bg-[#111111] glass-card border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-2">{card.title}</p>
              <p className="text-4xl font-black text-white">{card.value}</p>
            </div>
            <card.icon className="text-4xl text-primary/30" />
          </div>
        ))}
      </div>

      <div className="bg-[#111111] glass-card border border-white/5 p-8 rounded-2xl max-w-2xl">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-3">
          <FaDatabase className="text-primary" /> Database Operations
        </h3>
        <p className="text-secondary text-sm mb-6 leading-relaxed">
          If your Firebase Firestore database is currently empty, you can seed it with our standard set of 8 high-end audio products (amplifiers, speakers, sound systems, and cables).
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 bg-primary text-background px-6 py-3 rounded-full font-black uppercase text-sm tracking-wider hover:bg-[#b58c3c] disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(212,168,83,0.2)]"
        >
          <FaDatabase /> {seeding ? "Seeding..." : "Seed Dummy Products"}
        </button>
      </div>
    </div>
  );
}

function TabProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<ProductData>({
    name: "", category: "amplifiers", technology: "solid-state", priceRange: "under-50k", priceRangeText: "", description: "", image: "", specs: {}
  });
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductData)));
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  const openModal = (p?: ProductData) => {
    if (p) {
      setEditingProduct(p);
      setFormData(p);
    } else {
      setEditingProduct(null);
      setFormData({ name: "", category: "amplifiers", technology: "solid-state", priceRange: "under-50k", priceRangeText: "", description: "", image: "", specs: {} });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddSpec = () => {
    if (specKey && specValue) {
      setFormData(prev => ({ ...prev, specs: { ...prev.specs, [specKey]: specValue } }));
      setSpecKey(""); setSpecValue("");
    }
  };

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[key];
    setFormData(prev => ({ ...prev, specs: newSpecs }));
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      let imageUrl = formData.image;

      if (imageFile) {
        const fileRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const uploadTask = await uploadBytesResumable(fileRef, imageFile);
        imageUrl = await getDownloadURL(uploadTask.ref);
      }

      const payload = { ...formData, image: imageUrl || "placeholder" };

      if (editingProduct?.id) {
        await updateDoc(doc(db, "products", editingProduct.id), payload);
        toast.success("Product updated!");
      } else {
        await addDoc(collection(db, "products"), payload);
        toast.success("Product created!");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save product.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted.");
      fetchProducts();
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-black text-white uppercase tracking-widest">Products Catalog</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-full py-2 pl-12 pr-4 text-white focus:border-primary outline-none"
            />
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary text-background px-6 py-2 rounded-full font-bold uppercase hover:bg-[#b58c3c]">
            <FaPlus /> Add
          </button>
        </div>
      </div>

      {loading ? <div className="text-white text-center py-10">Loading...</div> : (
        <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-secondary uppercase tracking-widest text-xs">
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price Range</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-bold text-white">{p.name}</td>
                  <td className="p-4 text-sm text-secondary uppercase tracking-wider">{p.category}</td>
                  <td className="p-4 text-sm text-primary">{p.priceRangeText}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => openModal(p)} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg"><FaEdit /></button>
                    <button onClick={() => handleDelete(p.id!)} className="p-2 text-red-500/50 hover:text-red-500 bg-white/5 rounded-lg"><FaTrash /></button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-secondary">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-secondary hover:text-white">
              <FaTimes className="text-2xl" />
            </button>
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h3>

            <div className="space-y-4">
              <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              
              <div className="flex gap-4">
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white">
                  <option value="amplifiers" className="bg-[#111111]">Amplifiers</option>
                  <option value="speakers" className="bg-[#111111]">Speakers</option>
                  <option value="sound-systems" className="bg-[#111111]">Sound Systems</option>
                  <option value="cables" className="bg-[#111111]">Cables</option>
                </select>
                <select value={formData.technology} onChange={e => setFormData({...formData, technology: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white">
                  <option value="solid-state" className="bg-[#111111]">Solid State</option>
                  <option value="tube" className="bg-[#111111]">Tube</option>
                  <option value="hybrid" className="bg-[#111111]">Hybrid</option>
                  <option value="digital" className="bg-[#111111]">Digital</option>
                </select>
              </div>

              <div className="flex gap-4">
                <select value={formData.priceRange} onChange={e => setFormData({...formData, priceRange: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white">
                  <option value="under-50k" className="bg-[#111111]">Under ₹50K</option>
                  <option value="50k-1l" className="bg-[#111111]">₹50K - ₹1L</option>
                  <option value="1l-3l" className="bg-[#111111]">₹1L - ₹3L</option>
                  <option value="3l+" className="bg-[#111111]">₹3L+</option>
                </select>
                <input type="text" placeholder="Display Price (e.g. ₹1.4L / pair)" value={formData.priceRangeText} onChange={e => setFormData({...formData, priceRangeText: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              </div>

              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white min-h-[100px]" />

              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <p className="text-sm font-bold text-white uppercase tracking-widest mb-4">Specifications</p>
                {Object.entries(formData.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center bg-white/5 p-2 rounded mb-2">
                    <span className="text-white text-sm"><strong className="text-primary">{k}:</strong> {v}</span>
                    <button onClick={() => handleRemoveSpec(k)} className="text-red-500"><FaTimes /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <input type="text" placeholder="Key (e.g. Sensitivity)" value={specKey} onChange={e=>setSpecKey(e.target.value)} className="w-1/3 bg-transparent border-b border-white/20 text-white outline-none" />
                  <input type="text" placeholder="Value (e.g. 90dB)" value={specValue} onChange={e=>setSpecValue(e.target.value)} className="flex-1 bg-transparent border-b border-white/20 text-white outline-none" />
                  <button onClick={handleAddSpec} className="px-4 py-1 bg-white/10 text-white rounded hover:bg-white/20">Add</button>
                </div>
              </div>

              <div className="border border-white/10 rounded-xl p-4 bg-white/5 flex items-center gap-4">
                <FaImage className="text-2xl text-secondary" />
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-white text-sm w-full" />
              </div>

              <button onClick={handleSave} disabled={uploading || !formData.name} className="w-full py-4 bg-primary text-background font-black uppercase tracking-widest rounded-xl hover:bg-[#b58c3c] disabled:opacity-50 mt-4">
                {uploading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Hook for Tables
function useAdminTableData(collectionName: string) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, collectionName));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, collectionName, id), { status });
    toast.success("Status updated");
    fetchData();
  };

  return { data, search, setSearch, loading, updateStatus };
}

function TabOrders() {
  const { data, search, setSearch, loading, updateStatus } = useAdminTableData("orders");
  const filtered = data.filter(d => d.userPhone?.includes(search) || d.status?.includes(search));
  const STATUSES = ["Received", "Confirmed", "Processing", "Ready", "Delivered"];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-widest">Standard Orders</h2>
        <input type="text" placeholder="Search phone or status..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[#111111] border border-white/10 rounded-full py-2 px-4 text-white outline-none w-64" />
      </div>
      {loading ? <div className="text-white">Loading...</div> : (
        <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-secondary uppercase text-xs tracking-widest"><th className="p-4">Customer</th><th className="p-4">Item</th><th className="p-4">Date</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-white/5">
                  <td className="p-4 text-white">{o.userPhone}</td>
                  <td className="p-4 text-white font-bold">{o.productName}</td>
                  <td className="p-4 text-secondary text-sm">{o.createdAt?.toDate().toLocaleDateString()}</td>
                  <td className="p-4">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="bg-transparent border border-white/20 text-primary rounded p-1">
                      {STATUSES.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabCustomOrders() {
  const { data, search, setSearch, loading, updateStatus } = useAdminTableData("customOrders");
  const filtered = data.filter(d => d.userPhone?.includes(search) || d.type?.toLowerCase().includes(search.toLowerCase()));
  const STATUSES = ["pending", "Received", "Designing", "Building", "Testing", "Ready", "Delivered"];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-widest">Custom Orders</h2>
        <input type="text" placeholder="Search phone or type..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[#111111] border border-white/10 rounded-full py-2 px-4 text-white outline-none w-64" />
      </div>
      {loading ? <div className="text-white">Loading...</div> : (
        <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 text-secondary uppercase text-xs tracking-widest"><th className="p-4">Customer</th><th className="p-4">Type/Tech</th><th className="p-4">Tier/Finish</th><th className="p-4">Date</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-white">
                    {o.userPhone}
                    {o.notes && <p className="text-xs text-secondary mt-1 max-w-[150px] truncate" title={o.notes}>Notes: {o.notes}</p>}
                  </td>
                  <td className="p-4 text-white"><span className="font-bold">{o.type}</span><br/><span className="text-sm text-secondary">{o.technology}</span></td>
                  <td className="p-4 text-white"><span className="text-primary">{o.tier}</span><br/><span className="text-sm">{o.finish}</span></td>
                  <td className="p-4 text-secondary text-sm">{o.createdAt?.toDate().toLocaleDateString()}</td>
                  <td className="p-4">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="bg-transparent border border-white/20 text-primary rounded p-1">
                      {STATUSES.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabEnquiries() {
  const { data, search, setSearch, loading, updateStatus } = useAdminTableData("enquiries");
  const filtered = data.filter(d => d.userPhone?.includes(search) || d.productName?.toLowerCase().includes(search.toLowerCase()));
  const STATUSES = ["New", "Contacted", "In Discussion", "Closed"];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-widest">Enquiries</h2>
        <input type="text" placeholder="Search phone or product..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[#111111] border border-white/10 rounded-full py-2 px-4 text-white outline-none w-64" />
      </div>
      {loading ? <div className="text-white">Loading...</div> : (
        <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-secondary uppercase text-xs tracking-widest"><th className="p-4">Customer</th><th className="p-4">Product</th><th className="p-4">Channel</th><th className="p-4">Date</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-white">{o.userPhone}</td>
                  <td className="p-4 text-white font-bold">{o.productName}</td>
                  <td className="p-4 text-secondary uppercase text-sm">{o.method}</td>
                  <td className="p-4 text-secondary text-sm">{o.createdAt?.toDate().toLocaleDateString()}</td>
                  <td className="p-4">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="bg-transparent border border-white/20 text-primary rounded p-1">
                      {STATUSES.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
