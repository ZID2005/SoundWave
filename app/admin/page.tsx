"use client";

import { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import { db, storage, auth } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp, 
  setDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBoxOpen, 
  FaCommentDots, 
  FaBox, 
  FaCogs, 
  FaChartLine, 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes, 
  FaImage, 
  FaDatabase, 
  FaUser, 
  FaClock, 
  FaBell, 
  FaFileDownload,
  FaEnvelope,
  FaPhone,
  FaInfoCircle,
  FaShoppingCart
} from "react-icons/fa";
import toast from "react-hot-toast";
import { dummyProducts } from "@/lib/products";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

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

interface UserProfile {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  loginMethod: string;
  identifier: string;
  updatedAt?: Timestamp;
  cart?: { id: string; name: string; quantity: number; priceRangeText: string }[];
}

interface OrderData {
  id: string;
  userId: string;
  product: string;
  amount: number;
  status: string;
  createdAt: Timestamp;
  userPhone?: string;
}

interface CustomOrderData {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  technology: string;
  tier: string;
  finish: string;
  notes: string;
  status: string;
  createdAt: Timestamp;
  userPhone?: string;
}

interface UpcomingProductData {
  id?: string;
  name: string;
  category: string;
  image: string;
  teaser: string;
  releaseDate: string;
  code: string;
}

interface NotifyMeData {
  id: string;
  contact: string;
  productName: string;
  createdAt: Timestamp;
}

interface EnquiryData {
  id: string;
  userId: string;
  userPhone: string;
  productName: string;
  method: string;
  status: string;
  createdAt: Timestamp;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Database lists
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrderData[]>([]);
  const [upcomingProducts, setUpcomingProducts] = useState<UpcomingProductData[]>([]);
  const [notifyMeList, setNotifyMeList] = useState<NotifyMeData[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);

  // Fetch all collections in parallel safely
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const fetchCollection = async (name: string) => {
        try {
          const snap = await getDocs(collection(db, name));
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn(`Firestore collection "${name}" could not be loaded:`, e);
          return [];
        }
      };

      const [
        usersData,
        productsData,
        ordersData,
        customOrdersData,
        upcomingData,
        notifyData,
        enquiriesData
      ] = await Promise.all([
        fetchCollection("users"),
        fetchCollection("products"),
        fetchCollection("orders"),
        fetchCollection("customOrders"),
        fetchCollection("upcomingProducts"),
        fetchCollection("notifyMe"),
        fetchCollection("enquiries")
      ]);

      setUsers(usersData as UserProfile[]);
      setProducts(productsData as ProductData[]);
      
      // Sort orders by timestamp descending
      const sortedOrders = (ordersData as OrderData[]).sort(
        (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      );
      setOrders(sortedOrders);

      const sortedCustom = (customOrdersData as CustomOrderData[]).sort(
        (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      );
      setCustomOrders(sortedCustom);

      setUpcomingProducts(upcomingData as UpcomingProductData[]);
      
      const sortedNotify = (notifyData as NotifyMeData[]).sort(
        (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      );
      setNotifyMeList(sortedNotify);
      
      const sortedEnq = (enquiriesData as EnquiryData[]).sort(
        (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      );
      setEnquiries(sortedEnq);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to sync some Firestore tables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: FaChartLine },
    { id: "users", label: "Users List", icon: FaUser },
    { id: "products", label: "Products Catalog", icon: FaBox },
    { id: "orders", label: "Standard Orders", icon: FaBoxOpen },
    { id: "customOrders", label: "Custom Builds", icon: FaCogs },
    { id: "upcoming", label: "Next Wave", icon: FaClock },
    { id: "notifyMe", label: "Notify Requests", icon: FaBell },
    { id: "enquiries", label: "Enquiries", icon: FaCommentDots },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col md:flex-row pt-20 text-[#F5F5F5]">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-[#111111] border-r border-white/5 md:min-h-[calc(100vh-80px)] p-6 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible z-10 sticky top-20">
          <div className="hidden md:block mb-8">
            <span className="text-[0.6rem] tracking-[0.25em] font-semibold text-[#C9A84C] uppercase">Control Panel</span>
            <h2 className="text-xl font-bold font-serif text-white mt-1">SOUNDWAVE</h2>
          </div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-[#C9A84C] text-[#0D0D0D] shadow-[0_0_15px_rgba(201,168,76,0.25)]" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="text-lg shrink-0" />
              <span className="uppercase text-xs tracking-wider">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
          {loading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "dashboard" && (
                  <TabDashboard 
                    users={users} 
                    orders={orders} 
                    customOrders={customOrders} 
                    onRefresh={fetchAllData} 
                  />
                )}
                {activeTab === "users" && (
                  <TabUsers 
                    users={users} 
                    orders={orders} 
                    customOrders={customOrders} 
                  />
                )}
                {activeTab === "products" && (
                  <TabProducts 
                    products={products} 
                    onRefresh={fetchAllData} 
                  />
                )}
                {activeTab === "orders" && (
                  <TabOrders 
                    orders={orders} 
                    users={users} 
                    onRefresh={fetchAllData} 
                  />
                )}
                {activeTab === "customOrders" && (
                  <TabCustomOrders 
                    customOrders={customOrders} 
                    users={users} 
                    onRefresh={fetchAllData} 
                  />
                )}
                {activeTab === "upcoming" && (
                  <TabUpcoming 
                    upcomingProducts={upcomingProducts} 
                    onRefresh={fetchAllData} 
                  />
                )}
                {activeTab === "notifyMe" && (
                  <TabNotifyMe 
                    notifyMeList={notifyMeList} 
                  />
                )}
                {activeTab === "enquiries" && (
                  <TabEnquiries 
                    enquiries={enquiries} 
                    onRefresh={fetchAllData} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

      </div>
    </AdminGuard>
  );
}

// ─── HELPER COMPONENTS ───

// Count up anim
function CountUp({ end, duration = 1000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
}

// ─── TAB 1: SYSTEM DASHBOARD ───
function TabDashboard({ 
  users, 
  orders, 
  customOrders, 
  onRefresh 
}: { 
  users: UserProfile[]; 
  orders: OrderData[]; 
  customOrders: CustomOrderData[]; 
  onRefresh: () => Promise<void>; 
}) {
  const [seeding, setSeeding] = useState(false);

  const totalUsers = users.length;
  const totalCartItems = users.reduce(
    (acc, u) => acc + (u.cart?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0), 
    0
  );
  const totalOrders = orders.length;
  const totalCustomBuilds = customOrders.length;
  const pendingCustomBuilds = customOrders.filter(
    co => co.status === "pending" || co.status === "Pending Review"
  ).length;

  const handleSeed = async () => {
    if (confirm("This will seed the Firestore products collection with standard dummy products. Existing products with matching IDs will be overwritten. Continue?")) {
      setSeeding(true);
      try {
        for (const p of dummyProducts) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...data } = p;
          await setDoc(doc(db, "products", p.id), data);
        }
        toast.success(`Successfully seeded ${dummyProducts.length} products!`);
        onRefresh();
      } catch (e) {
        console.error("Error seeding products:", e);
        toast.error("Failed to seed database.");
      } finally {
        setSeeding(false);
      }
    }
  };

  const STAT_CARDS = [
    { title: "Total Registered Users", value: totalUsers, icon: FaUser },
    { title: "Total Items in Carts", value: totalCartItems, icon: FaShoppingCart },
    { title: "Total Orders Placed", value: totalOrders, icon: FaBoxOpen },
    { title: "Custom Builds Submitted", value: totalCustomBuilds, icon: FaCogs },
    { title: "Pending Review Builds", value: pendingCustomBuilds, icon: FaInfoCircle, highlight: pendingCustomBuilds > 0 },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest mb-8">
        System Overview
      </h2>
      
      {/* 5-Column Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {STAT_CARDS.map(card => (
          <div 
            key={card.title} 
            className={`glass-card border p-6 rounded-2xl flex flex-col justify-between h-36 transition-all duration-300 ${
              card.highlight 
                ? "border-[#C9A84C]/50 bg-[#C9A84C]/5" 
                : "border-white/5 bg-[#111111]"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-[0.55rem] tracking-[0.2em] font-semibold uppercase ${card.highlight ? "text-[#C9A84C]" : "text-neutral-400"}`}>
                {card.title}
              </span>
              <card.icon className={`text-lg ${card.highlight ? "text-[#C9A84C]" : "text-[#C9A84C]/40"}`} />
            </div>
            <p className={`text-4xl font-serif font-light text-glow-gold ${card.highlight ? "text-[#C9A84C]" : "text-white"}`}>
              <CountUp end={card.value} />
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#111111] glass-card border border-white/5 p-8 rounded-2xl max-w-2xl">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-3">
          <FaDatabase className="text-[#C9A84C]" /> Database Seeding
        </h3>
        <p className={`text-neutral-400 text-xs mb-6 leading-relaxed ${outfit.className}`}>
          If your Firestore products collection is empty, seed it with SOUNDWAVE&apos;s standard set of 8 reference audio products (amplifiers, speakers, sound systems, cables).
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 bg-[#C9A84C] text-[#0D0D0D] px-6 py-3 rounded-full font-black uppercase text-xs tracking-wider hover:bg-[#b58c3c] disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(201,168,76,0.2)]"
        >
          <FaDatabase /> {seeding ? "Seeding..." : "Seed Catalog Products"}
        </button>
      </div>
    </div>
  );
}

// ─── TAB 2: REGISTERED USERS ───
function TabUsers({ 
  users, 
  orders, 
  customOrders 
}: { 
  users: UserProfile[]; 
  orders: OrderData[]; 
  customOrders: CustomOrderData[]; 
}) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Compute order statistics per user
  const getUserOrdersCount = (uid: string) => {
    const stdCount = orders.filter(o => o.userId === uid).length;
    const custCount = customOrders.filter(co => co.userId === uid).length;
    return stdCount + custCount;
  };

  const getUserCartCount = (user: UserProfile) => {
    return user.cart?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
  };

  const filtered = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.phoneNumber?.includes(search) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest">
          Registered Users
        </h2>
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-xs text-white focus:border-[#C9A84C] outline-none transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-white/10 text-[#C9A84C] uppercase tracking-widest text-[0.65rem]">
              <th className="p-4">Name</th>
              <th className="p-4">Phone Number</th>
              <th className="p-4">Login Method</th>
              <th className="p-4">Joined Date</th>
              <th className="p-4">Total Orders</th>
              <th className="p-4">Cart Items</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-white/5 text-xs text-neutral-300 ${outfit.className}`}>
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white">{u.displayName || "N/A"}</td>
                <td className="p-4">{u.phoneNumber || u.email || "N/A"}</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded-full uppercase tracking-wider">
                    {u.loginMethod || "Email"}
                  </span>
                </td>
                <td className="p-4">
                  {u.updatedAt?.toDate?.() 
                    ? u.updatedAt.toDate().toLocaleDateString() 
                    : "Recently"}
                </td>
                <td className="p-4 font-bold text-white text-center sm:text-left">{getUserOrdersCount(u.uid)}</td>
                <td className="p-4 font-bold text-[#C9A84C] text-center sm:text-left">{getUserCartCount(u)} items</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setSelectedUser(u)}
                    className="px-4 py-1.5 bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 hover:bg-[#C9A84C] hover:text-[#0D0D0D] rounded-lg transition-all text-[0.65rem] font-bold uppercase tracking-widest"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out User Details Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#111111] border-l border-white/10 z-[101] p-8 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold font-serif text-[#C9A84C] uppercase tracking-widest">
                    User Details
                  </h3>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-14 h-14 rounded-full bg-[#C9A84C] text-[#0D0D0D] flex items-center justify-center font-bold text-xl">
                    {selectedUser.displayName?.substring(0, 2).toUpperCase() || "US"}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{selectedUser.displayName || "Guest user"}</h4>
                    <p className="text-neutral-400 text-xs mt-0.5">{selectedUser.email || "No Email linked"}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#C9A84C] uppercase block mb-2">Identifier Details</span>
                    <ul className={`space-y-2 text-xs text-neutral-300 ${outfit.className}`}>
                      <li className="flex items-center gap-2"><FaEnvelope className="text-neutral-500" /> {selectedUser.email || "N/A"}</li>
                      <li className="flex items-center gap-2"><FaPhone className="text-neutral-500" /> {selectedUser.phoneNumber || "N/A"}</li>
                      <li className="flex items-center gap-2"><span className="text-neutral-500 font-bold">UID:</span> <span className="font-mono text-neutral-400 text-[10px]">{selectedUser.uid}</span></li>
                    </ul>
                  </div>

                  {/* Active Cart Items Details */}
                  <div className="border-t border-white/5 pt-6">
                    <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#C9A84C] uppercase block mb-3">
                      Active Cart Items ({getUserCartCount(selectedUser)})
                    </span>
                    {selectedUser.cart && selectedUser.cart.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.cart.map((item: { id: string; name: string; quantity: number; priceRangeText: string }, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 text-xs">
                            <span className="text-white font-bold">{item.name}</span>
                            <span className="text-neutral-400">Qty: {item.quantity} • {item.priceRangeText}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-neutral-500 text-xs italic ${outfit.className}`}>Cart is currently empty.</p>
                    )}
                  </div>

                  {/* Orders and custom builds list */}
                  <div className="border-t border-white/5 pt-6">
                    <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#C9A84C] uppercase block mb-3">
                      Order Logs ({getUserOrdersCount(selectedUser.uid)})
                    </span>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {/* Standard orders */}
                      {orders.filter(o => o.userId === selectedUser.uid).map(o => (
                        <div key={o.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white truncate max-w-[200px]">{o.product}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">#{o.id.slice(-6).toUpperCase()} • Standard</p>
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-bold border border-primary/20 text-[#C9A84C] uppercase rounded">
                            {o.status}
                          </span>
                        </div>
                      ))}
                      {/* Custom orders */}
                      {customOrders.filter(co => co.userId === selectedUser.uid).map(co => (
                        <div key={co.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{co.type} ({co.tier})</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">#{co.id.slice(-6).toUpperCase()} • Custom Build</p>
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-bold border border-yellow-600/30 text-yellow-500 uppercase rounded">
                            {co.status}
                          </span>
                        </div>
                      ))}
                      {getUserOrdersCount(selectedUser.uid) === 0 && (
                        <p className={`text-neutral-500 text-xs italic ${outfit.className}`}>No order logs found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full mt-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl uppercase text-xs tracking-widest font-bold font-sans"
              >
                Close Profile
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TAB 3: PRODUCTS CATALOG (EXISTING PRESERVED) ───
function TabProducts({ 
  products, 
  onRefresh 
}: { 
  products: ProductData[]; 
  onRefresh: () => Promise<void>; 
}) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ProductData>({
    name: "", category: "amplifiers", technology: "solid-state", priceRange: "under-50k", priceRangeText: "", description: "", image: "", specs: {}
  });
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

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
      onRefresh();
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
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest">
          Products Catalog
        </h2>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-full py-2 pl-12 pr-4 text-xs text-white focus:border-[#C9A84C] outline-none"
            />
          </div>
          <button 
            onClick={() => openModal()} 
            className="flex items-center gap-2 bg-[#C9A84C] text-[#0D0D0D] px-6 py-2.5 rounded-full font-bold uppercase text-xs hover:bg-[#b58c3c] shadow-lg shadow-[#C9A84C]/10"
          >
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-[#C9A84C] uppercase tracking-widest text-[0.65rem]">
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price Range</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-white/5 text-xs text-neutral-300 ${outfit.className}`}>
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white">{p.name}</td>
                <td className="p-4 uppercase tracking-wider text-[10px] text-neutral-400">{p.category}</td>
                <td className="p-4 text-[#C9A84C] font-semibold">{p.priceRangeText}</td>
                <td className="p-4 flex gap-2 justify-end">
                  <button onClick={() => openModal(p)} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded-lg"><FaEdit /></button>
                  <button onClick={() => handleDelete(p.id!)} className="p-2 text-red-400 hover:text-red-500 bg-white/5 rounded-lg"><FaTrash /></button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-neutral-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card relative text-xs">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-white">
              <FaTimes className="text-2xl" />
            </button>
            <h3 className="text-2xl font-serif text-white uppercase tracking-widest mb-6">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h3>

            <div className="space-y-4">
              <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none" />
              
              <div className="flex gap-4">
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none">
                  <option value="amplifiers" className="bg-[#111111]">Amplifiers</option>
                  <option value="speakers" className="bg-[#111111]">Speakers</option>
                  <option value="sound-systems" className="bg-[#111111]">Sound Systems</option>
                  <option value="cables" className="bg-[#111111]">Cables</option>
                </select>
                <select value={formData.technology} onChange={e => setFormData({...formData, technology: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none">
                  <option value="solid-state" className="bg-[#111111]">Solid State</option>
                  <option value="tube" className="bg-[#111111]">Tube</option>
                  <option value="hybrid" className="bg-[#111111]">Hybrid</option>
                  <option value="digital" className="bg-[#111111]">Digital</option>
                </select>
              </div>

              <div className="flex gap-4">
                <select value={formData.priceRange} onChange={e => setFormData({...formData, priceRange: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none">
                  <option value="under-50k" className="bg-[#111111]">Under ₹50K</option>
                  <option value="50k-1l" className="bg-[#111111]">₹50K - ₹1L</option>
                  <option value="1l-3l" className="bg-[#111111]">₹1L - ₹3L</option>
                  <option value="3l+" className="bg-[#111111]">₹3L+</option>
                </select>
                <input type="text" placeholder="Display Price (e.g. ₹1.4L / pair)" value={formData.priceRangeText} onChange={e => setFormData({...formData, priceRangeText: e.target.value})} className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none" />
              </div>

              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white min-h-[100px] focus:border-[#C9A84C] outline-none" />

              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Specifications</p>
                {Object.entries(formData.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center bg-white/5 p-2 rounded mb-2">
                    <span className="text-white text-xs"><strong className="text-[#C9A84C]">{k}:</strong> {v}</span>
                    <button onClick={() => handleRemoveSpec(k)} className="text-red-500"><FaTimes /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <input type="text" placeholder="Key (e.g. Sensitivity)" value={specKey} onChange={e=>setSpecKey(e.target.value)} className="w-1/3 bg-transparent border-b border-white/20 text-white outline-none" />
                  <input type="text" placeholder="Value (e.g. 90dB)" value={specValue} onChange={e=>setSpecValue(e.target.value)} className="flex-1 bg-transparent border-b border-white/20 text-white outline-none" />
                  <button onClick={handleAddSpec} className="px-4 py-1.5 bg-[#C9A84C] text-[#0D0D0D] rounded font-bold uppercase hover:bg-[#b58c3c]">Add</button>
                </div>
              </div>

              <div className="border border-white/10 rounded-xl p-4 bg-white/5 flex items-center gap-4">
                <FaImage className="text-xl text-neutral-400" />
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-white text-xs w-full" />
              </div>

              <button onClick={handleSave} disabled={uploading || !formData.name} className="w-full py-3.5 bg-[#C9A84C] text-[#0D0D0D] font-black uppercase tracking-widest rounded-xl hover:bg-[#b58c3c] disabled:opacity-50 mt-4 shadow-lg shadow-[#C9A84C]/15">
                {uploading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 4: STANDARD ORDERS ───
function TabOrders({ 
  orders, 
  users, 
  onRefresh 
}: { 
  orders: OrderData[]; 
  users: UserProfile[]; 
  onRefresh: () => Promise<void>; 
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Not authenticated");
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ id, type: "order", status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update order status.");
      }

      toast.success("Order status updated!");
      onRefresh();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to update order status.";
      toast.error(msg);
    }
  };

  // Build users map for fast lookup
  const usersMap = users.reduce((acc, u) => {
    acc[u.uid] = u;
    return acc;
  }, {} as Record<string, UserProfile>);

  const STATUSES = ["Processing", "Delivered", "Cancelled"];

  const filtered = orders.filter(o => {
    const user = usersMap[o.userId] || {};
    const customerName = user.displayName || "";
    const customerPhone = user.phoneNumber || o.userPhone || "";
    const matchesSearch = 
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      customerPhone.includes(search);

    if (filterStatus === "All") return matchesSearch;
    if (filterStatus === "Pending") {
      return matchesSearch && (o.status === "Processing" || o.status === "Received" || o.status === "Pending");
    }
    return matchesSearch && o.status === filterStatus;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest">
          Standard Orders
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#111111] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#C9A84C]"
          >
            <option value="All" className="bg-[#111111]">All Orders</option>
            <option value="Pending" className="bg-[#111111]">Pending</option>
            <option value="Delivered" className="bg-[#111111]">Delivered</option>
            <option value="Cancelled" className="bg-[#111111]">Cancelled</option>
          </select>
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search ID, name, or phone..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full bg-[#111111] border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-xs text-white outline-none focus:border-[#C9A84C] transition-colors" 
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-white/10 text-[#C9A84C] uppercase tracking-widest text-[0.65rem]">
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Products</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-white/5 text-xs text-neutral-300 ${outfit.className}`}>
            {filtered.map(o => {
              const user = usersMap[o.userId] || {};
              return (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono text-[10px] text-neutral-400">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="p-4 font-bold text-white">{user.displayName || "Guest Customer"}</td>
                  <td className="p-4">{user.phoneNumber || o.userPhone || "N/A"}</td>
                  <td className="p-4 max-w-xs truncate" title={o.product}>{o.product}</td>
                  <td className="p-4 font-semibold text-[#C9A84C]">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(o.amount)}
                  </td>
                  <td className="p-4">
                    {o.createdAt?.toDate?.() 
                      ? o.createdAt.toDate().toLocaleDateString() 
                      : "Recently"}
                  </td>
                  <td className="p-4 text-right">
                    <select 
                      value={o.status === "Received" || o.status === "Processing" || o.status === "Pending" ? "Processing" : o.status} 
                      onChange={e => updateOrderStatus(o.id, e.target.value)} 
                      className="bg-transparent border border-white/20 text-[#C9A84C] rounded-lg p-1.5 focus:border-[#C9A84C] outline-none text-xs"
                    >
                      {STATUSES.map(s => <option key={s} value={s} className="bg-[#111111]">{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-neutral-500">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 5: CUSTOM CONFIGURATOR BUILDS ───
function TabCustomOrders({ 
  customOrders, 
  users, 
  onRefresh 
}: { 
  customOrders: CustomOrderData[]; 
  users: UserProfile[]; 
  onRefresh: () => Promise<void>; 
}) {
  const [search, setSearch] = useState("");
  const [selectedBuild, setSelectedBuild] = useState<CustomOrderData | null>(null);

  const updateCustomStatus = async (id: string, status: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Not authenticated");
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ id, type: "customOrder", status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update custom order status.");
      }

      toast.success("Custom order status updated!");
      onRefresh();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to update status.";
      toast.error(msg);
    }
  };

  const usersMap = users.reduce((acc, u) => {
    acc[u.uid] = u;
    return acc;
  }, {} as Record<string, UserProfile>);

  const STATUSES = ["Pending Review", "Contacted", "Confirmed", "Completed"];

  const filtered = customOrders.filter(co => {
    const user = usersMap[co.userId] || {};
    const customerName = user.displayName || "";
    const customerPhone = user.phoneNumber || co.userPhone || "";
    return (
      co.id.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      customerPhone.includes(search) ||
      co.type?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest">
          Custom configurator builds
        </h2>
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search custom builds..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-[#111111] border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-xs text-white outline-none focus:border-[#C9A84C]" 
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-white/10 text-[#C9A84C] uppercase tracking-widest text-[0.65rem]">
              <th className="p-4">Customer Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Product Type</th>
              <th className="p-4">Technology</th>
              <th className="p-4">Tier</th>
              <th className="p-4">Color/Finish</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-white/5 text-xs text-neutral-300 ${outfit.className}`}>
            {filtered.map(co => {
              const user = usersMap[co.userId] || {};
              const currentStatus = 
                co.status === "pending" ? "Pending Review" : 
                co.status === "Received" ? "Pending Review" :
                co.status === "Designing" ? "Contacted" :
                co.status === "Building" ? "Confirmed" :
                co.status === "Testing" ? "Confirmed" :
                co.status === "Ready" ? "Completed" :
                co.status === "Delivered" ? "Completed" :
                co.status;

              return (
                <tr key={co.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-white">{user.displayName || "Guest user"}</td>
                  <td className="p-4">{user.phoneNumber || co.userPhone || "N/A"}</td>
                  <td className="p-4 font-bold text-white uppercase tracking-wider text-[10px]">{co.type}</td>
                  <td className="p-4 text-neutral-400">{co.technology}</td>
                  <td className="p-4">
                    <span className="text-shiny-gold">{co.tier}</span>
                  </td>
                  <td className="p-4 text-neutral-400">{co.finish}</td>
                  <td className="p-4 text-[10px]">
                    {co.createdAt?.toDate?.() 
                      ? co.createdAt.toDate().toLocaleDateString() 
                      : "Recently"}
                  </td>
                  <td className="p-4 text-right">
                    <select 
                      value={STATUSES.includes(currentStatus) ? currentStatus : "Pending Review"} 
                      onChange={e => updateCustomStatus(co.id, e.target.value)} 
                      className="bg-transparent border border-white/20 text-[#C9A84C] rounded-lg p-1.5 focus:border-[#C9A84C] outline-none text-xs"
                    >
                      {STATUSES.map(s => <option key={s} value={s} className="bg-[#111111]">{s}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedBuild(co)}
                      className="px-3 py-1 bg-white/5 hover:bg-[#C9A84C]/20 border border-white/10 hover:border-[#C9A84C]/30 text-white rounded text-[10px]"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-neutral-500">No custom builds found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Build Details Dialog */}
      {selectedBuild && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 w-full max-w-xl glass-card relative text-xs">
            <button onClick={() => setSelectedBuild(null)} className="absolute top-6 right-6 text-neutral-400 hover:text-white">
              <FaTimes className="text-2xl" />
            </button>
            
            <h3 className="text-2xl font-serif text-white uppercase tracking-widest mb-6">
              Custom Build Config
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#C9A84C] uppercase block mb-1">Customer Name</span>
                  <p className="text-white font-bold text-sm">{(usersMap[selectedBuild.userId] || {}).displayName || "Guest user"}</p>
                </div>
                <div>
                  <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#C9A84C] uppercase block mb-1">Phone / Contact</span>
                  <p className="text-white font-bold text-sm">{(usersMap[selectedBuild.userId] || {}).phoneNumber || selectedBuild.userEmail || "N/A"}</p>
                </div>
              </div>

              {/* 6 Step Selection Summary */}
              <div className="space-y-4">
                <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#C9A84C] uppercase block">
                  Configuration (6-Step Selections)
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-neutral-500 text-[9px] uppercase tracking-wider block">Step 1: Product Type</span>
                    <span className="text-white font-bold text-xs">{selectedBuild.type}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-neutral-500 text-[9px] uppercase tracking-wider block">Step 2: Technology</span>
                    <span className="text-white font-bold text-xs">{selectedBuild.technology}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-neutral-500 text-[9px] uppercase tracking-wider block">Step 3: Quality Tier</span>
                    <span className="text-white font-bold text-xs">{selectedBuild.tier}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-neutral-500 text-[9px] uppercase tracking-wider block">Step 4: Finish/Color</span>
                    <span className="text-white font-bold text-xs">{selectedBuild.finish}</span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 text-[9px] uppercase tracking-wider block">Step 5: Special Requirements</span>
                  <p className={`text-white text-xs mt-1 leading-relaxed ${outfit.className}`}>
                    {selectedBuild.notes || "None submitted."}
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 text-[9px] uppercase tracking-wider block">Step 6: References / Metadata</span>
                  <p className={`text-neutral-400 text-[10px] mt-1 ${outfit.className}`}>
                    Submitted on: {selectedBuild.createdAt?.toDate?.() ? selectedBuild.createdAt.toDate().toLocaleString() : "Recently"}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedBuild(null)}
                className="w-full py-3 bg-[#C9A84C] text-[#0D0D0D] rounded-xl font-black uppercase tracking-wider hover:bg-[#b58c3c] mt-4"
              >
                Close Configuration Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 6: UPCOMING PRODUCTS MANAGER ───
function TabUpcoming({ 
  upcomingProducts, 
  onRefresh 
}: { 
  upcomingProducts: UpcomingProductData[]; 
  onRefresh: () => Promise<void>; 
}) {
  const [editingUpcoming, setEditingUpcoming] = useState<UpcomingProductData | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Amplifier");
  const [teaser, setTeaser] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const resetForm = () => {
    setEditingUpcoming(null);
    setName("");
    setCategory("Amplifier");
    setTeaser("");
    setReleaseDate("");
    setImageUrl("");
    setImageFile(null);
  };

  const handleEditClick = (p: UpcomingProductData) => {
    setEditingUpcoming(p);
    setName(p.name);
    setCategory(p.category);
    setTeaser(p.teaser);
    
    // Format timestamp/date string for input value (YYYY-MM-DDThh:mm)
    if (p.releaseDate) {
      setReleaseDate(p.releaseDate.substring(0, 16));
    } else {
      setReleaseDate("");
    }
    setImageUrl(p.image);
    setImageFile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !teaser || !releaseDate) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSaving(true);
    try {
      let finalImg = imageUrl;

      // Handle Storage Upload
      if (imageFile) {
        const fileRef = ref(storage, `upcoming/${Date.now()}_${imageFile.name}`);
        const uploadTask = await uploadBytesResumable(fileRef, imageFile);
        finalImg = await getDownloadURL(uploadTask.ref);
      }

      const payload = {
        name,
        category,
        teaser,
        releaseDate,
        image: finalImg || "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800",
        code: `# SW-${name.split(" ")[0].toUpperCase()}`,
      };

      if (editingUpcoming?.id) {
        await updateDoc(doc(db, "upcomingProducts", editingUpcoming.id), payload);
        toast.success("Upcoming product updated!");
      } else {
        await addDoc(collection(db, "upcomingProducts"), payload);
        toast.success("Upcoming product created!");
      }
      resetForm();
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save upcoming product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this upcoming product showcase?")) {
      try {
        await deleteDoc(doc(db, "upcomingProducts", id));
        toast.success("Upcoming product deleted.");
        onRefresh();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete.");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-xs">
      
      {/* List Panel */}
      <div className="lg:col-span-7 space-y-6">
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest mb-4">
          Upcoming Releases
        </h2>
        
        <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10 text-[#C9A84C] uppercase tracking-widest text-[0.65rem]">
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Launch Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-white/5 text-xs text-neutral-300 ${outfit.className}`}>
              {upcomingProducts.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <img src={p.image} alt={p.name} className="w-12 h-9 object-cover rounded border border-white/10" />
                  </td>
                  <td className="p-4 font-bold text-white">{p.name}</td>
                  <td className="p-4 uppercase tracking-wider text-[10px] text-neutral-400">{p.category}</td>
                  <td className="p-4">{new Date(p.releaseDate).toLocaleDateString()}</td>
                  <td className="p-4 text-right flex gap-2 justify-end items-center h-full pt-6">
                    <button onClick={() => handleEditClick(p)} className="p-2 text-neutral-400 hover:text-white bg-white/5 rounded"><FaEdit /></button>
                    <button onClick={() => handleDelete(p.id!)} className="p-2 text-red-400 hover:text-red-500 bg-white/5 rounded"><FaTrash /></button>
                  </td>
                </tr>
              ))}
              {upcomingProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    No custom upcoming products added yet. Standard placeholder cards are currently rendering on the Next Wave page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Form Panel */}
      <div className="lg:col-span-5 bg-[#111111] glass-card border border-white/5 p-8 rounded-2xl h-fit">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-6">
          {editingUpcoming ? "Edit Showcase" : "Create Upcoming Showcase"}
        </h3>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-neutral-400 mb-1.5 uppercase font-semibold">Product Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. AURA-9 Floorstanders"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1.5 uppercase font-semibold">Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none"
              >
                <option value="Amplifier" className="bg-[#111111]">Amplifier</option>
                <option value="Speaker" className="bg-[#111111]">Speaker</option>
                <option value="Cable" className="bg-[#111111]">Cable</option>
                <option value="Sound System" className="bg-[#111111]">Sound System</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1.5 uppercase font-semibold">Release Date</label>
              <input 
                type="datetime-local" 
                value={releaseDate} 
                onChange={e => setReleaseDate(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#C9A84C] outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1.5 uppercase font-semibold">Teaser Description</label>
            <textarea 
              value={teaser} 
              onChange={e => setTeaser(e.target.value)} 
              placeholder="Write a teaser summary to build excitement..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white min-h-[80px] focus:border-[#C9A84C] outline-none" 
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1.5 uppercase font-semibold">Upload Image</label>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-white text-xs" 
              />
            </div>
            {editingUpcoming && !imageFile && (
              <p className="text-neutral-500 text-[10px] mt-1">Retaining existing showcase URL: <span className="font-mono">{imageUrl.slice(0, 30)}...</span></p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="flex-grow py-3 bg-[#C9A84C] text-[#0D0D0D] font-bold uppercase tracking-wider rounded-xl hover:bg-[#b58c3c] disabled:opacity-50"
            >
              {saving ? "Saving..." : editingUpcoming ? "Update Product" : "Publish Product"}
            </button>
            {editingUpcoming && (
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl uppercase tracking-wider font-bold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}

// ─── TAB 7: NOTIFY ME LIST ───
function TabNotifyMe({ 
  notifyMeList 
}: { 
  notifyMeList: NotifyMeData[]; 
}) {
  const [search, setSearch] = useState("");

  const exportToCSV = () => {
    const headers = ["Contact Info", "Requested Product", "Date Submitted"];
    const rows = notifyMeList.map(item => {
      const date = item.createdAt?.toDate?.() 
        ? item.createdAt.toDate().toLocaleString() 
        : "N/A";
      return [
        `"${(item.contact || "").replace(/"/g, '""')}"`,
        `"${(item.productName || "").replace(/"/g, '""')}"`,
        `"${date}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `soundwave_notify_me_list_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Notify Me CSV exported!");
  };

  const filtered = notifyMeList.filter(item => 
    item.contact?.toLowerCase().includes(search.toLowerCase()) || 
    item.productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 text-xs">
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest">
            Notify requests
          </h2>
          <p className="text-neutral-400 text-[10px] tracking-wider mt-1">Users registered for updates on upcoming releases.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full sm:w-64 bg-[#111111] border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-white focus:border-[#C9A84C] outline-none" 
            />
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-[#C9A84C] text-[#0D0D0D] px-5 py-2.5 rounded-full font-bold uppercase tracking-wider hover:bg-[#b58c3c] shadow-lg shadow-[#C9A84C]/10"
          >
            <FaFileDownload /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-white/10 text-[#C9A84C] uppercase tracking-widest text-[0.65rem]">
              <th className="p-4">Name / Phone / Email</th>
              <th className="p-4">Requested Product</th>
              <th className="p-4 text-right">Date Submitted</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-white/5 text-xs text-neutral-300 ${outfit.className}`}>
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white">{item.contact}</td>
                <td className="p-4 font-semibold text-[#C9A84C]">{item.productName}</td>
                <td className="p-4 text-right">
                  {item.createdAt?.toDate?.() 
                    ? item.createdAt.toDate().toLocaleString() 
                    : "Recently"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-neutral-500">No notify requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 8: ENQUIRIES (EXISTING PRESERVED) ───
function TabEnquiries({ 
  enquiries, 
  onRefresh 
}: { 
  enquiries: EnquiryData[]; 
  onRefresh: () => Promise<void>; 
}) {
  const [search, setSearch] = useState("");
  const STATUSES = ["New", "Contacted", "In Discussion", "Closed"];

  const updateEnquiryStatus = async (id: string, status: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Not authenticated");
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ id, type: "enquiry", status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update enquiry status.");
      }

      toast.success("Enquiry status updated!");
      onRefresh();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to update status.";
      toast.error(msg);
    }
  };

  const filtered = enquiries.filter(d => 
    d.userPhone?.includes(search) || 
    d.productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-3xl font-light text-white uppercase tracking-widest">
          Enquiries
        </h2>
        <input 
          type="text" 
          placeholder="Search phone or product..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="bg-[#111111] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#C9A84C] w-64" 
        />
      </div>

      <div className="overflow-x-auto bg-[#111111] border border-white/5 rounded-2xl glass-card">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-[#C9A84C] uppercase tracking-widest text-[0.65rem]">
              <th className="p-4">Customer Phone</th>
              <th className="p-4">Product Name</th>
              <th className="p-4">Contact Channel</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-white/5 text-xs text-neutral-300 ${outfit.className}`}>
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-white">{o.userPhone}</td>
                <td className="p-4 text-white font-bold">{o.productName}</td>
                <td className="p-4 text-neutral-400 uppercase tracking-wider text-[10px]">{o.method}</td>
                <td className="p-4 text-neutral-400">
                  {o.createdAt?.toDate?.() 
                    ? o.createdAt.toDate().toLocaleDateString() 
                    : "Recently"}
                </td>
                <td className="p-4 text-right">
                  <select 
                    value={o.status} 
                    onChange={e => updateEnquiryStatus(o.id, e.target.value)} 
                    className="bg-transparent border border-white/20 text-[#C9A84C] rounded-lg p-1.5 focus:border-[#C9A84C] outline-none text-xs"
                  >
                    {STATUSES.map(s => <option key={s} value={s} className="bg-[#111111]">{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No enquiries found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
