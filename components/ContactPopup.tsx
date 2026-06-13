"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// toast removed

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function ContactPopup({ isOpen, onClose, productName }: ContactPopupProps) {
  const { user } = useAuth();
  const phoneNumber = "919567931330";
  const whatsappMsg = encodeURIComponent(`Hi, I'm interested in the ${productName}`);
  const emailSubject = encodeURIComponent(`Inquiry: ${productName}`);

  const handleContactClick = async (e: React.MouseEvent<HTMLAnchorElement>, url: string, method: string) => {
    e.preventDefault();
    
    if (user) {
      try {
        await addDoc(collection(db, "enquiries"), {
          userId: user.uid,
          userPhone: user.phoneNumber,
          productName,
          method,
          status: "Contacted",
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error saving enquiry:", error);
      }
    }
    
    window.open(url, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl glass-card z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-secondary hover:text-white transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest leading-tight">
                Get in Touch
              </h3>
              <p className="text-primary mt-2 font-bold">{productName}</p>
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              <a
                href={`https://wa.me/${phoneNumber}?text=${whatsappMsg}`}
                onClick={(e) => handleContactClick(e, `https://wa.me/${phoneNumber}?text=${whatsappMsg}`, "WhatsApp")}
                className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold tracking-wider transition-colors shadow-lg shadow-[#25D366]/20"
              >
                <FaWhatsapp className="text-2xl" /> Chat on WhatsApp
              </a>

              <a
                href={`mailto:soundwave.sarga@gmail.com?subject=${emailSubject}`}
                onClick={(e) => handleContactClick(e, `mailto:soundwave.sarga@gmail.com?subject=${emailSubject}`, "Email")}
                className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-xl font-bold tracking-wider transition-colors shadow-lg shadow-[#0066cc]/20"
              >
                <FaEnvelope className="text-2xl" /> Send Email
              </a>

              <a
                href={`tel:+${phoneNumber}`}
                onClick={(e) => handleContactClick(e, `tel:+${phoneNumber}`, "Phone")}
                className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-primary hover:bg-[#b58c3c] text-background rounded-xl font-black tracking-wider transition-colors shadow-lg shadow-primary/20"
              >
                <FaPhone className="text-2xl" /> Call Us
              </a>
            </div>

            {/* Footer */}
            <p className="text-center text-secondary text-sm mt-8">
              We typically respond within 2 hours during business days.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
