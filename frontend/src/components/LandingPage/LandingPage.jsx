import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingCart, 
  Layers, 
  QrCode, 
  TrendingUp, 
  ShieldCheck, 
  Building2, 
  Store, 
  Users, 
  Check, 
  ArrowRight, 
  Zap, 
  Cpu, 
  Lock, 
  Clock, 
  ChevronRight, 
  Crown,
  LogIn,
  CheckCircle2,
  RefreshCw,
  Sliders,
  DollarSign,
  Smartphone,
  Printer,
  Star,
  MessageSquare,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { tenantApi } from '../../services/api';
import ShinyText from '../common/ShinyText';
import SpotlightCard from '../common/SpotlightCard';
import DecryptedText from '../common/DecryptedText';
import StatusBadge from '../common/StatusBadge';

export default function LandingPage({ onGoToLogin, onExploreDemo }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFeatureTab, setActiveFeatureTab] = useState('matrix');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Bento Interactive Playground State
  const [demoSize, setDemoSize] = useState('L');
  const [demoColor, setDemoColor] = useState('Royal Navy');
  const [demoPayment, setDemoPayment] = useState('bKash');

  // Dynamic CMS Content
  const [cms, setCms] = useState({
    seo_meta: {
      title: "OmniFlow POS — Next-Gen Multi-Tenant Fashion & Retail Cloud ERP | Bangladesh",
      description: "Sub-second multi-showroom POS, apparel size-color matrix hangtag generator, 2FA biometric attendance & inter-branch stock transfers built for Bangladesh retail fashion brands."
    },
    announcement: {
      is_visible: true,
      badge: "NEW 2026",
      text: "OmniFlow POS 2.0: Multi-Tenant Garment Matrix & Zero-Storage Privacy Engine Live",
      link_text: "Explore Demo →"
    },
    hero: {
      eyebrow: "Built specifically for Bangladesh Retail & Multi-Showroom Chains",
      headline_line1: "The Modern Multi-Tenant",
      headline_gradient: "Fashion POS & Matrix ERP",
      subheadline: "Eliminate operational chaos with instant garment hangtag barcodes, 2FA biometric attendance, split-payment fast billing, and inter-branch stock requisitions. Completely decoupled multi-tenant architecture with custom UI themes.",
      cta_primary_text: "Launch Showroom POS",
      cta_secondary_text: "View Monthly Plans",
      stats: [
        { value: "< 8ms", label: "Sub-Second Billing" },
        { value: "0 Bytes", label: "Zero-Storage Privacy" },
        { value: "100% ACID", label: "Isolated Multi-Tenant" },
        { value: "GMT+6", label: "Dhaka NTP Synchronized" }
      ]
    },
    features: [
      {
        id: "matrix",
        tab_label: "👗 Garment Size-Color Matrix",
        badge: "Retail Garments & Apparel Matrix",
        title: "One-Click Matrix Generation for Apparel Chains",
        description: "Stop creating individual SKUs manually. Select your Fabric GSM, Season, Gender, Size Range (S, M, L, XL, XXL) and Color Palette to instantly generate dozens of unique barcode hangtags with MRP & Size indicators.",
        bullets: [
          "Instant thermal hangtag barcode label printing (50mm × 35mm format)",
          "Live showroom stock matrix breakdown across all branch outlets",
          "Automated SKU formulation based on GSM and category codes"
        ]
      },
      {
        id: "pos",
        tab_label: "⚡ Fast POS & Split Payments",
        badge: "High-Velocity Counter POS",
        title: "Sub-Second POS Billing with Multi-Payment Split",
        description: "Designed for peak retail rush hours. Scan barcodes via laser scanner, webcam, or instant SKU lookup. Split single invoices seamlessly across Cash, bKash, Nagad, and POS Debit/Credit cards with automatic change calculation.",
        bullets: [
          "Real-time cart adjustment, item quantity modifier, and instant line deletion",
          "Customizable thermal receipt header, footer notes, and store VAT BIN numbers"
        ]
      },
      {
        id: "attendance",
        tab_label: "🛡️ 2FA QR Attendance & Incentive",
        badge: "2FA Biometric Handshake",
        title: "Zero-Storage Privacy & Staff Incentive Engine",
        description: "Prevent proxy check-ins. Salesmen generate dynamic time-expiring attendance QR codes on their mobile, which are verified instantly by Store Managers. Attendance data drives monthly sales targets and automated commission payouts.",
        bullets: [
          "Zero-Storage Privacy Protocol: Face camera captures are processed in RAM and discarded instantly",
          "Late grace periods and automated incentive commission calculations"
        ]
      },
      {
        id: "transfers",
        tab_label: "🚚 Inter-Branch Stock Requisition",
        badge: "Inter-Branch Inventory Fleet",
        title: "Showroom-to-Warehouse Stock Requisition",
        description: "When a showroom runs low on specific garment sizes, store staff create instant digital requisitions. Central warehouse managers review, approve, and dispatch stock with transit tracking and automatic inventory handoffs.",
        bullets: [
          "Eliminates garment stockouts in high-traffic outlets",
          "Real-time transfer verification upon physical arrival at showroom"
        ]
      }
    ],
    architecture: {
      eyebrow: "Multi-Tenant Isolation",
      title: "Each Tenant Gets an Isolated, Custom-Branded Universe",
      subtitle: "Unlike legacy POS software, OmniFlow completely isolates tenant visual themes, receipt branding, and database transactions.",
      pillars: [
        {
          title: "Decoupled SuperAdmin Console",
          description: "SuperAdmin operates on a standalone Midnight & Gold master console. Dedicated solely to tenant onboarding, plan pricing creation, global users, and server telemetry."
        },
        {
          title: "Dynamic Brand Whitelabeling",
          description: "Each brand configures their custom app surface background tone (Slate, Cream, Mint, Sky, Dark), receipt header tagline, logo, and VAT identification numbers."
        },
        {
          title: "Strict ACID Data Isolation",
          description: "Zero cross-tenant data leakage. Every transaction, sales history, employee account, and stock transfer is scoped strictly to the respective brand tenant."
        }
      ]
    },
    testimonials: [
      {
        client_name: "Tanvir Chowdhury",
        role: "Operations Director",
        brand: "Vogue Lifestyle Retail Ltd",
        location: "Dhanmondi & Uttara, Dhaka",
        quote: "Generating clothing size-color matrices for our seasonal panjabi and polo collections used to take 2 days. With OmniFlow, it takes 30 seconds with automatic hangtag barcodes!",
        rating: 5
      },
      {
        client_name: "Nafisa Rahman",
        role: "Founder & Head of Retail",
        brand: "Aura Boutiques",
        location: "Banani 11, Dhaka",
        quote: "The 2FA biometric attendance with zero-storage privacy solved all our staff proxy issues. Our cashiers love the split payment POS during weekend rush hours.",
        rating: 5
      },
      {
        client_name: "Sajid Hasan",
        role: "Supply Chain Head",
        brand: "Apex Trend Apparel",
        location: "Jamuna Future Park",
        quote: "Inter-branch stock requisitions transformed our multi-outlet inventory. Showrooms request low sizes and our central warehouse dispatches in real-time.",
        rating: 5
      }
    ],
    faqs: [
      {
        question: "Can I run OmniFlow POS on regular PC, Android tablet, and touch screens?",
        answer: "Yes! OmniFlow POS is 100% responsive and works flawlessly on desktop Chrome, Android tablets, touch terminals, thermal receipt printers, and barcode laser scanners with zero hardware lock-in."
      },
      {
        question: "How does the Clothing Matrix handle Size (S/M/L/XL) and Color variations?",
        answer: "Our apparel matrix generator creates a 2D matrix of Size × Color × GSM. You can adjust prices and stock per cell or bulk populate. It automatically formats unique barcodes for 50x35mm thermal hangtags."
      },
      {
        question: "What is the Zero-Storage Privacy Protocol for 2FA Attendance?",
        answer: "Unlike intrusive biometric systems that store facial photos on external servers, OmniFlow processes verification ephemeral in RAM and releases the memory buffer immediately (0 bytes retained on disk)."
      },
      {
        question: "How do Inter-Branch Stock Transfers work?",
        answer: "When an outlet runs low on a garment size, staff generate a requisition with one click. Central warehouse reviews, approves, and marks as 'In Transit'. When physically received, showroom staff click 'Receive Stock' to auto-update local inventory."
      },
      {
        question: "Can I change my Showroom UI Theme and Receipt format?",
        answer: "Yes. Each store owner can choose from 6 preset surface tones (Slate, Cream, Mint, Sky, Dark, White) or enter custom HEX codes, plus customize their receipt logo, tagline, helpline, exchange policy, and VAT BIN."
      }
    ],
    footer: {
      company_name: "OmniFlow POS Cloud Systems",
      tagline: "Asia/Dhaka (GMT+6) Enterprise Cloud POS & ERP",
      hotline: "+880 1700-000000",
      email: "support@omniflow.pos.bd",
      address: "Level 7, Lotus Kamal Tower, Gulshan-2, Dhaka 1212",
      copyright: "© 2026 OmniFlow POS SaaS. All Rights Reserved."
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, cmsData] = await Promise.all([
        tenantApi.getPlans().catch(() => []),
        tenantApi.getLandingContent().catch(() => null)
      ]);

      if (Array.isArray(plansData) && plansData.length > 0) {
        setPlans(plansData);
      }
      if (cmsData) {
        setCms({
          seo_meta: { ...cms.seo_meta, ...(cmsData.seo_meta || {}) },
          announcement: { ...cms.announcement, ...(cmsData.announcement || {}) },
          hero: { ...cms.hero, ...(cmsData.hero || {}) },
          features: Array.isArray(cmsData.features) && cmsData.features.length > 0 ? cmsData.features : cms.features,
          architecture: { ...cms.architecture, ...(cmsData.architecture || {}) },
          testimonials: Array.isArray(cmsData.testimonials) && cmsData.testimonials.length > 0 ? cmsData.testimonials : cms.testimonials,
          faqs: Array.isArray(cmsData.faqs) && cmsData.faqs.length > 0 ? cmsData.faqs : cms.faqs,
          footer: { ...cms.footer, ...(cmsData.footer || {}) },
          theme: cmsData.theme || {
            bg_color: '#030712',
            accent_color: '#10b981',
            accent_gradient_to: '#059669',
            secondary_color: '#f59e0b',
            surface_color: '#0f172a',
            surface_border: '#1e293b',
            text_color: '#f8fafc',
            preset: 'MIDNIGHT_EMERALD'
          }
        });

        // Set Document Title for SEO
        if (cmsData.seo_meta?.title) {
          document.title = cmsData.seo_meta.title;
        }
      }
    } catch (err) {
      console.warn("Could not load landing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedFeature = (Array.isArray(cms.features) && cms.features.length > 0)
    ? (cms.features.find(f => f.id === activeFeatureTab) || cms.features[0])
    : null;

  const theme = cms.theme || {
    bg_color: '#030712',
    accent_color: '#10b981',
    accent_gradient_to: '#059669',
    secondary_color: '#f59e0b',
    surface_color: '#0f172a',
    surface_border: '#1e293b',
    text_color: '#f8fafc',
    preset: 'MIDNIGHT_EMERALD'
  };

  return (
    <div 
      className="min-h-screen font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-500 relative overflow-x-hidden"
      style={{
        backgroundColor: theme.bg_color || '#030712',
        color: theme.text_color || '#f8fafc'
      }}
    >
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      {cms?.announcement?.is_visible !== false && (
        <div 
          className="relative z-50 px-3 sm:px-4 py-2 text-center text-[11px] sm:text-xs font-medium text-white shadow-sm flex items-center justify-center gap-2 border-b border-white/[0.08] backdrop-blur-md"
          style={{
            background: `linear-gradient(to right, ${theme.accent_color}25, ${theme.accent_gradient_to || theme.accent_color}35, ${theme.surface_color || '#0f172a'}90)`
          }}
        >
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border border-white/20">
            {cms?.announcement?.badge || "NEW 2026"}
          </span>
          <span className="truncate max-w-[220px] sm:max-w-none text-slate-200">
            <ShinyText text={cms?.announcement?.text || "OmniFlow POS 2.0: Multi-Tenant Garment Matrix Live"} speed={4} />
          </span>
          <button 
            onClick={onGoToLogin} 
            className="font-bold underline underline-offset-2 hover:text-white transition-colors shrink-0 ml-1"
            style={{ color: theme.accent_color || '#10b981' }}
          >
            {cms?.announcement?.link_text || "Explore Demo →"}
          </button>
        </div>
      )}

      {/* 2. MAIN HEADER NAVIGATION (Apple-grade floating glass bar) */}
      <header 
        className="sticky top-0 z-40 border-b backdrop-blur-2xl transition-all duration-300"
        style={{
          backgroundColor: `${theme.bg_color || '#030712'}cc`,
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl text-slate-950 font-black shadow-lg shadow-emerald-500/10 transition-transform duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${theme.accent_color || '#10b981'}, ${theme.accent_gradient_to || '#059669'})`,
              }}
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight" style={{ color: theme.text_color || '#ffffff' }}>OmniFlow</span>
                <span 
                  className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: `${theme.accent_color || '#10b981'}20`,
                    color: theme.accent_color || '#10b981',
                    border: `1px solid ${theme.accent_color || '#10b981'}40`
                  }}
                >
                  POS
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-mono tracking-tight">Retail & Fashion ERP</p>
            </div>
          </div>

          {/* Nav links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors duration-200">Capabilities</a>
            <a href="#architecture" className="hover:text-white transition-colors duration-200">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing Plans</a>
            <a href="#reviews" className="hover:text-white transition-colors duration-200">Testimonials</a>
            <a href="#faqs" className="hover:text-white transition-colors duration-200">FAQ</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onGoToLogin}
              className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-200 transition-all duration-200 hover:bg-white/10 active:scale-95"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.12)'
              }}
            >
              <LogIn className="h-3.5 w-3.5" style={{ color: theme.accent_color || '#10b981' }} />
              <span>Login</span>
            </button>

            <button
              onClick={onGoToLogin}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(to right, ${theme.accent_color || '#10b981'}, ${theme.accent_gradient_to || '#059669'})`,
                boxShadow: `0 8px 20px -4px ${theme.accent_color || '#10b981'}40`
              }}
            >
              <span>Explore Platform</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-950" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (Airy, spacious, Apple-grade minimalism) */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
        
        {/* Soft Ambient Light Cones */}
        <div 
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[600px] sm:w-[850px] rounded-full blur-[140px] animate-pulse-glow"
          style={{ backgroundColor: `${theme.accent_color || '#10b981'}30` }}
        />
        <div 
          className="pointer-events-none absolute top-1/3 -right-24 h-72 w-72 rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: theme.secondary_color || '#f59e0b' }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-5 sm:space-y-7">
          
          {/* Eyebrow floating pill */}
          {cms?.hero?.eyebrow && (
            <div className="inline-flex items-center justify-center">
              <div 
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] sm:text-xs font-medium backdrop-blur-xl shadow-sm animate-float max-w-[92vw] sm:max-w-none text-balance"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  color: theme.accent_color || '#10b981'
                }}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: theme.secondary_color || '#f59e0b' }} />
                <span className="text-slate-200">{cms.hero.eyebrow}</span>
              </div>
            </div>
          )}

          {/* Master Headline */}
          <h1 
            className="mx-auto max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.15] text-balance"
            style={{ color: theme.text_color || '#ffffff' }}
          >
            {cms?.hero?.headline_line1 || "The Modern Multi-Tenant"} <br className="hidden sm:inline" />
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.accent_color || '#10b981'}, ${theme.secondary_color || '#f59e0b'})`
              }}
            >
              {cms?.hero?.headline_gradient || "Fashion POS & Matrix ERP"}
            </span>
          </h1>

          {/* Subheadline with breathing room */}
          <p className="mx-auto max-w-2xl text-xs sm:text-sm md:text-base text-slate-400 font-normal leading-relaxed text-balance px-2">
            {cms?.hero?.subheadline || "Eliminate operational chaos with instant garment hangtag barcodes, 2FA biometric attendance, and inter-branch stock transfers."}
          </p>

          {/* Action Buttons (Refined Pills with UIverse sweeping shine) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 sm:pt-5 w-full max-w-xs sm:max-w-none mx-auto">
            <button
              onClick={onGoToLogin}
              className="group relative overflow-hidden w-full sm:w-auto h-12 px-7 rounded-full text-xs sm:text-sm font-bold text-slate-950 shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(to right, ${theme.accent_color || '#10b981'}, ${theme.accent_gradient_to || '#059669'})`,
                boxShadow: `0 12px 30px -6px ${theme.accent_color || '#10b981'}50`
              }}
            >
              <span className="pointer-events-none absolute -inset-full top-0 block -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-shine-sweep" />
              <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              <span>{cms?.hero?.cta_primary_text || "Launch Showroom POS"}</span>
            </button>

            <a
              href="#pricing"
              className="w-full sm:w-auto h-12 px-6 rounded-full text-xs sm:text-sm font-semibold text-slate-200 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                borderWidth: '1px'
              }}
            >
              <DollarSign className="h-4 w-4" style={{ color: theme.secondary_color || '#f59e0b' }} />
              <span>{cms?.hero?.cta_secondary_text || "View Monthly Plans"}</span>
            </a>
          </div>

          {/* Quick Metrics Bar (React-Bits Spotlight Cards + DecryptedText) */}
          {cms?.hero?.stats && cms.hero.stats.length > 0 && (
            <div className="pt-8 sm:pt-14 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
              {cms.hero.stats.map((st, i) => (
                <SpotlightCard
                  key={i}
                  spotlightColor="rgba(16, 185, 129, 0.18)"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  className="!rounded-2xl !border !border-white/[0.08] !bg-white/[0.025] !p-3.5 sm:!p-4 !backdrop-blur-xl transition-all duration-300 hover:!border-white/25 hover:!bg-white/[0.06] text-center"
                >
                  <div 
                    className="text-base sm:text-xl font-black font-mono tracking-tight"
                    style={{ color: theme.accent_color || '#10b981' }}
                  >
                    <DecryptedText text={st.value} animateOn="mount" speed={30} encryptedClassName="text-emerald-400/80" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{st.label}</div>
                </SpotlightCard>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 4. MODERN BENTO GRID PRODUCT CAPABILITIES */}
      <section id="features" className="py-20 sm:py-28 md:py-36 border-t border-white/[0.06] relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span 
              className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border inline-block"
              style={{
                backgroundColor: `${theme.accent_color || '#10b981'}15`,
                color: theme.accent_color || '#10b981',
                borderColor: `${theme.accent_color || '#10b981'}30`
              }}
            >
              Engine Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Designed for Speed. <br className="hidden sm:inline" />
              Engineered for Fashion Retail.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed text-balance">
              Purpose-built modules that eliminate checkout bottlenecks, barcode confusion, and inventory discrepancies across multi-branch chains.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            
            {/* Bento Card 1: Apparel Size-Color Matrix (Spans 2 columns) */}
            <SpotlightCard 
              spotlightColor="rgba(16, 185, 129, 0.16)"
              borderColor="rgba(255, 255, 255, 0.22)"
              className="md:col-span-2 !rounded-3xl !border-white/[0.08] !p-6 sm:!p-8 !backdrop-blur-2xl transition-all duration-300 hover:!border-white/20 flex flex-col justify-between group relative overflow-hidden !bg-white/[0.025]"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span 
                    className="flex h-8 w-8 items-center justify-center rounded-xl font-bold shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent_color || '#10b981'}, ${theme.accent_gradient_to || '#059669'})`,
                      color: '#030712'
                    }}
                  >
                    <Layers className="h-4 w-4 text-slate-950" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Garment Matrix Engine</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Single-Click Apparel Variant & Barcode Matrix
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
                  Generate hundreds of Size × Color SKUs in 3 seconds. Instant hangtag barcode printing with custom brand typography.
                </p>
              </div>

              {/* Interactive Matrix Demo Sandbox */}
              <div className="mt-6 pt-5 border-t border-white/[0.08] space-y-4 relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Select Size:</span>
                    <div className="flex items-center gap-1.5">
                      {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setDemoSize(sz)}
                          className={`h-7 w-9 rounded-lg text-xs font-mono font-bold transition-all ${
                            demoSize === sz
                              ? 'text-slate-950 font-black scale-105 shadow-md'
                              : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                          style={demoSize === sz ? {
                            backgroundColor: theme.accent_color || '#10b981'
                          } : {}}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Color Shade:</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { name: 'Royal Navy', hex: '#1e3a8a' },
                        { name: 'Sage Olive', hex: '#3f6212' },
                        { name: 'Crimson', hex: '#991b1b' },
                        { name: 'Charcoal', hex: '#1f2937' },
                      ].map((col) => (
                        <button
                          key={col.name}
                          onClick={() => setDemoColor(col.name)}
                          className={`h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                            demoColor === col.name
                              ? 'border-2 text-white scale-105'
                              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                          style={{ borderColor: demoColor === col.name ? (theme.accent_color || '#10b981') : undefined }}
                        >
                          <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: col.hex }} />
                          <span>{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generated Hangtag Pill */}
                <div 
                  className="rounded-2xl border border-white/[0.08] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs shadow-inner"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-28 bg-white rounded px-2 py-0.5 flex flex-col items-center justify-center border border-slate-200">
                      <div className="flex items-stretch justify-center h-4 w-full gap-[1px]">
                        {[2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1].map((w, i) => (
                          <span key={i} className="bg-slate-950 h-full inline-block" style={{ width: `${w}px` }} />
                        ))}
                      </div>
                      <span className="text-[7px] text-slate-800 font-mono font-bold mt-0.5">89400{demoSize.charCodeAt(0)}821</span>
                    </div>
                    <div>
                      <div className="text-white font-sans font-bold text-xs">Premium Panjabi 2026 Edition</div>
                      <div className="text-[10px] text-slate-400">SKU: PAN-{demoColor.substring(0, 3).toUpperCase()}-{demoSize}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                    <span className="text-xs font-black text-amber-400">৳ 2,850.00</span>
                    <span 
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{
                        backgroundColor: `${theme.accent_color || '#10b981'}20`,
                        color: theme.accent_color || '#10b981'
                      }}
                    >
                      ● 18 in Stock
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 2: Split-Second POS Checkout */}
            <SpotlightCard 
              spotlightColor="rgba(245, 158, 11, 0.16)"
              borderColor="rgba(255, 255, 255, 0.22)"
              className="!rounded-3xl !border-white/[0.08] !p-6 sm:!p-8 !backdrop-blur-2xl transition-all duration-300 hover:!border-white/20 flex flex-col justify-between group !bg-white/[0.025]"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="flex h-8 w-8 items-center justify-center rounded-xl font-bold shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${theme.secondary_color || '#f59e0b'}, #ea580c)`,
                      color: '#030712'
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 text-slate-950" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sub-Second Billing</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Rapid POS & Split Payments
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Barcode gun speed with zero latency. Accept combined Cash + bKash + Card settlements in a single receipt.
                </p>
              </div>

              {/* Mini Interactive Receipt Slip */}
              <div 
                className="mt-6 rounded-2xl border border-white/[0.08] p-4 font-mono text-xs space-y-2.5 shadow-inner"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/[0.08] pb-1.5 font-bold">
                  <span>COUNTER: POS-01</span>
                  <span className="text-emerald-400">&lt; 8ms Latency</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Panjabi ({demoSize})</span>
                  <span>৳ 2,850</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>VAT (5%)</span>
                  <span>৳ 142.50</span>
                </div>
                <div className="border-t border-white/[0.08] pt-1.5 flex justify-between font-bold text-white text-xs">
                  <span>Payable Total</span>
                  <span className="text-amber-400">৳ 2,992.50</span>
                </div>

                {/* Payment Selector */}
                <div className="grid grid-cols-3 gap-1 pt-1 font-sans">
                  {['Cash', 'bKash', 'Card'].map((pm) => (
                    <button
                      key={pm}
                      onClick={() => setDemoPayment(pm)}
                      className={`py-1 rounded text-[10px] font-bold transition-all ${
                        demoPayment === pm
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 3: 2FA Biometric Check-In */}
            <SpotlightCard 
              spotlightColor="rgba(16, 185, 129, 0.16)"
              borderColor="rgba(255, 255, 255, 0.22)"
              className="!rounded-3xl !border-white/[0.08] !p-6 sm:!p-8 !backdrop-blur-2xl transition-all duration-300 hover:!border-white/20 flex flex-col justify-between group !bg-white/[0.025]"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="flex h-8 w-8 items-center justify-center rounded-xl font-bold shadow-md bg-emerald-500 text-slate-950"
                  >
                    <QrCode className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dhaka Cloud Time</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  2FA Dual-Device Handshake
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eliminates buddy punching and time manipulation with verified QR scan pairing between staff and manager.
                </p>
              </div>

              {/* Live Time Card */}
              <div 
                className="mt-6 rounded-2xl border border-white/[0.08] p-4 text-xs font-mono space-y-2 shadow-inner"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>NTP STATUS</span>
                  <StatusBadge status="active" label="100% SYNCED" size="xs" />
                </div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Asia/Dhaka (GMT+6)</span>
                </div>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-[10px] text-emerald-300 font-sans font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Verified Present • Grace Window Active</span>
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 4: Inter-Branch Logistics (Spans 2 columns) */}
            <SpotlightCard 
              spotlightColor="rgba(59, 130, 246, 0.16)"
              borderColor="rgba(255, 255, 255, 0.22)"
              className="md:col-span-2 !rounded-3xl !border-white/[0.08] !p-6 sm:!p-8 !backdrop-blur-2xl transition-all duration-300 hover:!border-white/20 flex flex-col justify-between group !bg-white/[0.025]"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="flex h-8 w-8 items-center justify-center rounded-xl font-bold shadow-md bg-blue-500 text-slate-950"
                  >
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Multi-Showroom Sync</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Inter-Branch Stock Transfer & Fleet Requisition
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                  Request low-inventory garments directly from Central Warehouse or peer showrooms with atomic stock locks and dispatch confirmation.
                </p>
              </div>

              {/* Interactive Transfer Route Demo */}
              <div 
                className="mt-6 rounded-2xl border border-white/[0.08] p-4 text-xs font-mono shadow-inner space-y-3"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="font-bold text-white font-sans">Central Warehouse (HQ)</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    🚚 Transfer #TRQ-8812 In Transit
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white font-sans">Dhanmondi Flagship Outlet</span>
                  </div>
                </div>

                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-1.5 rounded-full"
                    style={{
                      width: '68%',
                      background: `linear-gradient(to right, ${theme.accent_color || '#10b981'}, ${theme.secondary_color || '#f59e0b'})`
                    }}
                  />
                </div>
              </div>
            </SpotlightCard>

          </div>

        </div>
      </section>

      {/* 5. MULTI-TENANT ISOLATION ARCHITECTURE */}
      <section id="architecture" className="py-20 sm:py-28 md:py-36 border-t border-white/[0.06] relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span 
              className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border inline-block"
              style={{
                backgroundColor: `${theme.secondary_color || '#f59e0b'}15`,
                color: theme.secondary_color || '#f59e0b',
                borderColor: `${theme.secondary_color || '#f59e0b'}30`
              }}
            >
              Enterprise Security
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Isolated, Sovereign Brand Universes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed text-balance">
              Every merchant brand runs within strict multi-tenant boundaries with customized thermal print branding and zero cross-talk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            
            <div 
              className="rounded-3xl border border-white/[0.08] p-6 sm:p-8 space-y-4 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.025)' }}
            >
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-2xl font-bold shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent_color || '#10b981'}, ${theme.accent_gradient_to || '#059669'})`,
                  color: '#030712'
                }}
              >
                <ShieldCheck className="h-5 w-5 text-slate-950" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Zero-Leakage Tenant Sandboxing</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Database queries, product variants, customer ledgers, and revenue records are partitioned with hardware-level tenant IDs.
              </p>
            </div>

            <div 
              className="rounded-3xl border border-white/[0.08] p-6 sm:p-8 space-y-4 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.025)' }}
            >
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-2xl font-bold shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${theme.secondary_color || '#f59e0b'}, #ea580c)`,
                  color: '#030712'
                }}
              >
                <Printer className="h-5 w-5 text-slate-950" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Thermal Slip Whitelabel Engine</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Customize shop logos, BIN tax registration numbers, return policy clauses, and barcode formatting independently per showroom.
              </p>
            </div>

            <div 
              className="rounded-3xl border border-white/[0.08] p-6 sm:p-8 space-y-4 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.025)' }}
            >
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-2xl font-bold shadow-md bg-purple-500 text-slate-950"
              >
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Role-Based Security Boundary</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Showroom managers, billing cashiers, and sales reps operate in distinct permission domains with PIN-secured supervisor overrides.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. MONTHLY SUBSCRIPTION PLANS & PRICING */}
      <section id="pricing" className="py-20 sm:py-28 md:py-36 border-t border-white/[0.06] relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span 
              className="rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide border inline-block"
              style={{
                backgroundColor: `${theme.accent_color || '#10b981'}15`,
                color: theme.accent_color || '#10b981',
                borderColor: `${theme.accent_color || '#10b981'}35`
              }}
            >
              Transparent Monthly SaaS Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Choose the Right Plan for Your Retail Chain
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 text-balance">
              Customizable monthly tiers created and managed directly by SuperAdmin. All plans include Dhaka timezone support and zero hardware lock-in.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-5xl mx-auto">
            {Array.isArray(plans) && plans.map((plan) => {
              const isPopular = plan.is_popular || plan.code === 'PRO';
              return (
                <SpotlightCard
                  key={plan.id || plan.code}
                  spotlightColor={isPopular ? "rgba(16, 185, 129, 0.22)" : "rgba(255, 255, 255, 0.1)"}
                  borderColor={isPopular ? (theme.accent_color || '#10b981') : "rgba(255, 255, 255, 0.15)"}
                  className={`!rounded-3xl !p-6 sm:!p-8 flex flex-col justify-between !backdrop-blur-2xl transition-all duration-300 ${
                    isPopular
                      ? 'border-2 shadow-2xl relative md:-translate-y-2 animate-border-glow !bg-white/[0.045]'
                      : '!border !border-white/[0.08] hover:!border-white/20 !bg-white/[0.02]'
                  }`}
                >
                  {isPopular && (
                    <span 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[9px] font-black text-slate-950 uppercase tracking-wide shadow-md whitespace-nowrap z-20"
                      style={{
                        background: `linear-gradient(to right, ${theme.accent_color || '#10b981'}, ${theme.secondary_color || '#f59e0b'})`
                      }}
                    >
                      Most Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white tracking-tight">{plan.name}</h3>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-white/10 text-slate-300 border border-white/10">
                        {plan.code}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">{plan.description}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        ৳{plan.monthly_price?.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ month</span>
                    </div>

                    <div className="mt-6 border-t border-white/[0.08] pt-6 space-y-3">
                      <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                        <Check className="h-4 w-4 shrink-0" style={{ color: theme.accent_color || '#10b981' }} />
                        <span>Up to {plan.max_branches} Showroom Outlets</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                        <Check className="h-4 w-4 shrink-0" style={{ color: theme.accent_color || '#10b981' }} />
                        <span>Up to {plan.max_users} Staff Accounts</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                        <Check className="h-4 w-4 shrink-0" style={{ color: theme.accent_color || '#10b981' }} />
                        <span>High-Speed Fast POS Terminal</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                        <Check className="h-4 w-4 shrink-0" style={{ color: theme.accent_color || '#10b981' }} />
                        <span>Clothing Hangtag Barcode Matrix</span>
                      </div>
                      {plan.features?.attendance_handshake && (
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                          <Check className="h-4 w-4 shrink-0" style={{ color: theme.accent_color || '#10b981' }} />
                          <span>2FA Biometric QR Attendance</span>
                        </div>
                      )}
                      {plan.features?.inter_branch_transfer && (
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                          <Check className="h-4 w-4 shrink-0" style={{ color: theme.accent_color || '#10b981' }} />
                          <span>Inter-Branch Stock Transfer Fleet</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-2">
                    <button
                      onClick={onGoToLogin}
                      className="w-full rounded-full py-3 text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      style={isPopular ? {
                        background: `linear-gradient(to right, ${theme.accent_color || '#10b981'}, ${theme.accent_gradient_to || '#059669'})`,
                        color: '#030712',
                        boxShadow: `0 8px 20px -4px ${theme.accent_color || '#10b981'}40`
                      } : {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        borderWidth: '1px',
                        color: '#f8fafc'
                      }}
                    >
                      Get Started with {plan.code}
                    </button>
                  </div>

                </SpotlightCard>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS & TESTIMONIALS */}
      {Array.isArray(cms?.testimonials) && cms.testimonials.length > 0 && (
        <section id="reviews" className="py-20 sm:py-28 md:py-36 border-t border-white/[0.06] relative">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-2.5 max-w-2xl mx-auto">
              <span 
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: theme.secondary_color || '#f59e0b' }}
              >
                Social Proof
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Trusted by Retail Fashion Leaders
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {cms.testimonials.map((t, idx) => (
                <div 
                  key={idx} 
                  className="rounded-3xl border border-white/[0.08] p-6 sm:p-7 space-y-4 shadow-sm backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.025)' }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="border-t border-white/[0.08] pt-3">
                    <div className="font-bold text-white text-xs">{t.client_name}</div>
                    <div className="text-[11px] font-medium" style={{ color: theme.accent_color || '#10b981' }}>{t.role}, {t.brand}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{t.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {Array.isArray(cms?.faqs) && cms.faqs.length > 0 && (
        <section id="faqs" className="py-20 sm:py-28 md:py-36 border-t border-white/[0.06] relative">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-10">
            <div className="text-center space-y-2.5">
              <span 
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: theme.accent_color || '#10b981' }}
              >
                Inquiries
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {cms.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="rounded-2xl border border-white/[0.08] overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-white/20"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.025)' }}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-white hover:text-slate-200 transition-colors"
                    >
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown 
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} 
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.06] pt-3 animate-in fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 9. FOOTER (Airy Apple minimalist footer) */}
      <footer className="border-t border-white/[0.08] py-14 text-slate-400 text-xs backdrop-blur-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-950 font-bold"
              style={{
                background: `linear-gradient(135deg, ${theme.accent_color || '#10b981'}, ${theme.accent_gradient_to || '#059669'})`
              }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">{cms?.footer?.company_name || "OmniFlow POS SaaS"}</span>
              <p className="text-[10px] text-slate-400 font-mono">{cms?.footer?.tagline || "Asia/Dhaka (GMT+6) Enterprise Cloud"}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-slate-400 text-center sm:text-left text-xs">
            <span>📞 {cms?.footer?.hotline || "+880 1700-000000"}</span>
            <span>✉️ {cms?.footer?.email || "support@omniflow.pos.bd"}</span>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right">
            {cms?.footer?.copyright || `© ${new Date().getFullYear()} OmniFlow POS. All Rights Reserved.`}
          </div>
        </div>
      </footer>

    </div>
  );
}
