import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Sparkles, 
  Crown,
  Layers, 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  Phone, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Eye, 
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { tenantApi } from '../../services/api';

const LANDING_THEME_PRESETS = [
  {
    name: 'Midnight Emerald (Default)',
    id: 'MIDNIGHT_EMERALD',
    bg_color: '#030712',
    accent_color: '#10b981',
    accent_gradient_to: '#059669',
    secondary_color: '#f59e0b',
    surface_color: '#0f172a',
    surface_border: '#1e293b',
    text_color: '#f8fafc',
    desc: 'Deep Obsidian with Glowing Emerald Accent'
  },
  {
    name: ' Apple Space Gray Titanium',
    id: 'APPLE_SPACE_GRAY',
    bg_color: '#0b0c0e',
    accent_color: '#2997ff',
    accent_gradient_to: '#0071e3',
    secondary_color: '#f56300',
    surface_color: '#15171c',
    surface_border: '#242833',
    text_color: '#f5f5f7',
    desc: 'Cupertino Space Gray with Precision Blue & Titanium Glass'
  },
  {
    name: ' Apple Natural Titanium Pro',
    id: 'APPLE_NATURAL_TITANIUM',
    bg_color: '#141312',
    accent_color: '#d4af37',
    accent_gradient_to: '#b8973b',
    secondary_color: '#30d158',
    surface_color: '#1f1e1b',
    surface_border: '#33322d',
    text_color: '#f5f5f7',
    desc: 'iPhone 16 Pro Natural Titanium with Frosted Metallic Glass'
  },
  {
    name: ' Apple Desert Titanium 16 Pro',
    id: 'APPLE_DESERT_TITANIUM',
    bg_color: '#130e0a',
    accent_color: '#e0a96d',
    accent_gradient_to: '#c58940',
    secondary_color: '#ff453a',
    surface_color: '#1f1812',
    surface_border: '#362a20',
    text_color: '#fdfaf6',
    desc: 'Warm Desert Titanium with Micro-Blasted Bronze Aesthetics'
  },
  {
    name: ' Apple OLED Starlight Midnight',
    id: 'APPLE_OLED_STARLIGHT',
    bg_color: '#000000',
    accent_color: '#ffffff',
    accent_gradient_to: '#d2d2d7',
    secondary_color: '#2997ff',
    surface_color: '#0d0d0f',
    surface_border: '#1e1e24',
    text_color: '#ffffff',
    desc: 'Pitch True Black OLED with Apple Starlight Ceramic Highlights'
  },
  {
    name: ' Apple Studio Keynote (Light)',
    id: 'APPLE_STUDIO_LIGHT',
    bg_color: '#f5f5f7',
    accent_color: '#0071e3',
    accent_gradient_to: '#005bb5',
    secondary_color: '#ff9f0a',
    surface_color: '#ffffff',
    surface_border: '#d2d2d7',
    text_color: '#1d1d1f',
    desc: 'Crisp Cupertino Keynote Aesthetic with Pure White Glass Cards'
  },
  {
    name: ' Apple Sonoma Sunset Aurora',
    id: 'APPLE_SONOMA_SUNSET',
    bg_color: '#0d0714',
    accent_color: '#ff375f',
    accent_gradient_to: '#ff9f0a',
    secondary_color: '#bf5af2',
    surface_color: '#181124',
    surface_border: '#2e2142',
    text_color: '#fbfbfd',
    desc: 'macOS Sonoma Aurora Glow with Frosted Glass Surface'
  },
  {
    name: ' Apple Alpine Green Ultra',
    id: 'APPLE_ALPINE_GREEN',
    bg_color: '#041209',
    accent_color: '#30d158',
    accent_gradient_to: '#34c759',
    secondary_color: '#ffd60a',
    surface_color: '#0b2115',
    surface_border: '#143d28',
    text_color: '#f0fdf4',
    desc: 'Nordic Pine & Watch Ultra Alpine Green Glassmorphism'
  },
  {
    name: 'Obsidian Gold Luxury',
    id: 'OBSIDIAN_GOLD',
    bg_color: '#050505',
    accent_color: '#f59e0b',
    accent_gradient_to: '#d97706',
    secondary_color: '#10b981',
    surface_color: '#121212',
    surface_border: '#262626',
    text_color: '#fafafa',
    desc: 'Premium Luxury Gold on Deep Black'
  },
  {
    name: 'Cyberpunk Neon Cyan',
    id: 'CYBERPUNK_CYAN',
    bg_color: '#040d1a',
    accent_color: '#06b6d4',
    accent_gradient_to: '#3b82f6',
    secondary_color: '#f59e0b',
    surface_color: '#081a2e',
    surface_border: '#0e3054',
    text_color: '#f0f9ff',
    desc: 'Futuristic High-Tech Cyan Glow'
  },
  {
    name: 'Royal Indigo & Violet',
    id: 'ROYAL_VIOLET',
    bg_color: '#09071a',
    accent_color: '#8b5cf6',
    accent_gradient_to: '#6366f1',
    secondary_color: '#38bdf8',
    surface_color: '#130f2e',
    surface_border: '#271e54',
    text_color: '#f5f3ff',
    desc: 'Deep Indigo Space with Neon Violet'
  },
  {
    name: 'Crimson Ruby Night',
    id: 'CRIMSON_RUBY',
    bg_color: '#0f0508',
    accent_color: '#f43f5e',
    accent_gradient_to: '#e11d48',
    secondary_color: '#fbbf24',
    surface_color: '#1c0b11',
    surface_border: '#3b1420',
    text_color: '#fff1f2',
    desc: 'Dramatic Velvet Burgundy & Ruby'
  },
  {
    name: 'Clean Modern Minimal (Light)',
    id: 'CLEAN_LIGHT',
    bg_color: '#f8fafc',
    accent_color: '#0f172a',
    accent_gradient_to: '#334155',
    secondary_color: '#10b981',
    surface_color: '#ffffff',
    surface_border: '#e2e8f0',
    text_color: '#0f172a',
    desc: 'Crisp Light Editorial Canvas'
  }
];

const SUPERADMIN_THEME_PRESETS = [
  {
    name: 'Obsidian Gold Master (Default)',
    id: 'OBSIDIAN_GOLD',
    bg_color: '#030712',
    accent_color: '#f59e0b',
    surface_color: '#0f172a',
    border_color: '#1e293b',
    text_color: '#f8fafc',
    desc: 'Midnight Console with Gold Master Accents'
  },
  {
    name: ' Apple Space Gray Titanium',
    id: 'APPLE_SPACE_GRAY_PRO',
    bg_color: '#0b0c0e',
    accent_color: '#2997ff',
    surface_color: '#15171c',
    border_color: '#242833',
    text_color: '#f5f5f7',
    desc: 'macOS Sequoia Dark Mode with Precision Blue Command'
  },
  {
    name: ' Apple Natural Titanium Pro',
    id: 'APPLE_NATURAL_TITANIUM_ADMIN',
    bg_color: '#141312',
    accent_color: '#d4af37',
    surface_color: '#1f1e1b',
    border_color: '#33322d',
    text_color: '#f5f5f7',
    desc: 'iPhone 16 Pro Natural Titanium Brushed Metal Finish'
  },
  {
    name: ' Apple Desert Titanium 16 Pro',
    id: 'APPLE_DESERT_TITANIUM_ADMIN',
    bg_color: '#130e0a',
    accent_color: '#e0a96d',
    surface_color: '#1f1812',
    border_color: '#362a20',
    text_color: '#fdfaf6',
    desc: 'Refined Desert Bronze Metallic Command Surface'
  },
  {
    name: ' Apple OLED Midnight Stealth',
    id: 'APPLE_OLED_STEALTH',
    bg_color: '#000000',
    accent_color: '#ffffff',
    surface_color: '#0d0d0f',
    border_color: '#1e1e24',
    text_color: '#ffffff',
    desc: 'True Black 100% OLED with Razor Clean Starlight Accents'
  },
  {
    name: ' Apple Studio Keynote Light',
    id: 'APPLE_STUDIO_LIGHT_ADMIN',
    bg_color: '#f5f5f7',
    accent_color: '#0071e3',
    surface_color: '#ffffff',
    border_color: '#d2d2d7',
    text_color: '#1d1d1f',
    desc: 'Clean Cupertino Keynote Light Mode Studio Console'
  },
  {
    name: ' Apple Alpine Green Ultra',
    id: 'APPLE_ALPINE_ADMIN',
    bg_color: '#041209',
    accent_color: '#30d158',
    surface_color: '#0b2115',
    border_color: '#143d28',
    text_color: '#f0fdf4',
    desc: 'Watch Ultra Alpine Titanium & Precision Mint Terminal'
  },
  {
    name: ' Apple Sonoma Aurora Purple',
    id: 'APPLE_SONOMA_ADMIN',
    bg_color: '#0d0714',
    accent_color: '#bf5af2',
    surface_color: '#181124',
    border_color: '#2e2142',
    text_color: '#faf5ff',
    desc: 'macOS Sonoma Aurora Glass Imperial Aesthetics'
  },
  {
    name: 'Emerald Titanium',
    id: 'EMERALD_TITANIUM',
    bg_color: '#02120b',
    accent_color: '#10b981',
    surface_color: '#062417',
    border_color: '#0f422d',
    text_color: '#ecfdf5',
    desc: 'High-Tech Emerald Terminal'
  },
  {
    name: 'Cyber Night Sky',
    id: 'CYBER_NIGHT',
    bg_color: '#040f1f',
    accent_color: '#38bdf8',
    surface_color: '#081a2e',
    border_color: '#0e3054',
    text_color: '#f0f9ff',
    desc: 'Deep Deep Navy with Electric Sky Blue'
  },
  {
    name: 'Deep Carbon Minimal',
    id: 'DEEP_CARBON',
    bg_color: '#09090b',
    accent_color: '#e2e8f0',
    surface_color: '#18181b',
    border_color: '#27272a',
    text_color: '#fafafa',
    desc: 'Monochrome Stealth Developer Aesthetic'
  },
  {
    name: 'Royal Amethyst',
    id: 'ROYAL_AMETHYST',
    bg_color: '#100517',
    accent_color: '#a855f7',
    surface_color: '#1c0a29',
    border_color: '#381452',
    text_color: '#faf5ff',
    desc: 'Exclusive Imperial Violet Console'
  }
];

export default function LandingPageCmsEditor({ onPreviewLive }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('landing_theme');
  const [feedback, setFeedback] = useState(null);

  const [cmsData, setCmsData] = useState({
    seo_meta: {
      title: '',
      description: '',
      keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
      canonical_url: '',
      author: 'OmniFlow Cloud Systems Dhaka',
      robots: 'index, follow'
    },
    announcement: {
      is_visible: true,
      badge: 'NEW 2026',
      text: '',
      link_text: 'Explore Demo →'
    },
    hero: {
      eyebrow: '',
      headline_line1: '',
      headline_gradient: '',
      subheadline: '',
      cta_primary_text: '',
      cta_secondary_text: '',
      stats: []
    },
    features: [],
    architecture: {
      eyebrow: '',
      title: '',
      subtitle: '',
      pillars: []
    },
    testimonials: [],
    faqs: [],
    footer: {
      company_name: '',
      tagline: '',
      hotline: '',
      email: '',
      address: '',
      copyright: ''
    },
    theme: {
      bg_color: '#030712',
      accent_color: '#10b981',
      accent_gradient_to: '#059669',
      secondary_color: '#f59e0b',
      surface_color: '#0f172a',
      surface_border: '#1e293b',
      text_color: '#f8fafc',
      preset: 'MIDNIGHT_EMERALD'
    },
    superadmin_theme: {
      bg_color: '#030712',
      accent_color: '#f59e0b',
      surface_color: '#0f172a',
      border_color: '#1e293b',
      text_color: '#f8fafc',
      preset: 'OBSIDIAN_GOLD'
    }
  });

  useEffect(() => {
    fetchCmsData();
  }, []);

  const fetchCmsData = async () => {
    try {
      setLoading(true);
      const data = await tenantApi.getLandingContent();
      if (data) {
        setCmsData({
          seo_meta: data.seo_meta || {},
          announcement: data.announcement || {},
          hero: data.hero || {},
          features: Array.isArray(data.features) ? data.features : [],
          architecture: data.architecture || {},
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
          faqs: Array.isArray(data.faqs) ? data.faqs : [],
          footer: data.footer || {},
          theme: data.theme || {
            bg_color: '#030712',
            accent_color: '#10b981',
            accent_gradient_to: '#059669',
            secondary_color: '#f59e0b',
            surface_color: '#0f172a',
            surface_border: '#1e293b',
            text_color: '#f8fafc',
            preset: 'MIDNIGHT_EMERALD'
          },
          superadmin_theme: data.superadmin_theme || {
            bg_color: '#030712',
            accent_color: '#f59e0b',
            surface_color: '#0f172a',
            border_color: '#1e293b',
            text_color: '#f8fafc',
            preset: 'OBSIDIAN_GOLD'
          }
        });
      }
    } catch (err) {
      console.warn("Could not load landing content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);
      await tenantApi.updateLandingContent(cmsData);
      setFeedback({ type: 'success', message: 'Landing Page & SEO metadata published live successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save landing content' });
    } finally {
      setSaving(false);
    }
  };

  // Feature Add / Remove
  const handleAddFeature = () => {
    setCmsData({
      ...cmsData,
      features: [
        ...cmsData.features,
        {
          id: `feature_${Date.now()}`,
          tab_label: '✨ New Feature Module',
          badge: 'Feature Badge',
          title: 'New Feature Title',
          description: 'Feature detailed explanation and retail benefits...',
          bullets: ['Benefit bullet 1', 'Benefit bullet 2']
        }
      ]
    });
  };

  const handleRemoveFeature = (index) => {
    const updated = [...cmsData.features];
    updated.splice(index, 1);
    setCmsData({ ...cmsData, features: updated });
  };

  // Testimonial Add / Remove
  const handleAddTestimonial = () => {
    setCmsData({
      ...cmsData,
      testimonials: [
        ...cmsData.testimonials,
        {
          client_name: 'Store Director',
          role: 'Owner & Founder',
          brand: 'Brand Boutique',
          location: 'Dhaka, Bangladesh',
          quote: 'OmniFlow revolutionized our retail operations and multi-branch stock management.',
          rating: 5
        }
      ]
    });
  };

  const handleRemoveTestimonial = (index) => {
    const updated = [...cmsData.testimonials];
    updated.splice(index, 1);
    setCmsData({ ...cmsData, testimonials: updated });
  };

  // FAQ Add / Remove
  const handleAddFaq = () => {
    setCmsData({
      ...cmsData,
      faqs: [
        ...cmsData.faqs,
        {
          question: 'What hardware is required?',
          answer: 'OmniFlow works on any standard web browser, PC, Android tablet, and USB/Ethernet thermal receipt printer.'
        }
      ]
    });
  };

  const handleRemoveFaq = (index) => {
    const updated = [...cmsData.faqs];
    updated.splice(index, 1);
    setCmsData({ ...cmsData, faqs: updated });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-amber-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading Landing Page CMS & SEO Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-bold">
              <Globe className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              SuperAdmin Content Management & SEO Engine
            </span>
          </div>
          <h3 className="mt-1 text-xl font-black text-white">
            Landing Page CMS, SEO & Structured Schema Studio
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Modify public website copy, hero banners, feature modules, FAQs, customer proof & Google search meta tags in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onPreviewLive && (
            <button
              onClick={onPreviewLive}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all shadow-sm"
            >
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              <span>Live Preview</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Publishing...' : '💾 Publish Changes Live'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
        }`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. CMS Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'landing_theme', label: '🎨 Landing UI & Background', icon: Sliders },
          { id: 'superadmin_theme', label: '👑 SuperAdmin Console Theme', icon: Sparkles },
          { id: 'seo', label: '🏷️ SEO & Schema Markup', icon: FileText },
          { id: 'hero', label: '⚡ Hero & Announcement', icon: Sparkles },
          { id: 'features', label: `👗 Core Features (${cmsData.features.length})`, icon: Layers },
          { id: 'testimonials', label: `💬 Testimonials (${cmsData.testimonials.length})`, icon: MessageSquare },
          { id: 'faqs', label: `❓ FAQs (${cmsData.faqs.length})`, icon: HelpCircle },
          { id: 'footer', label: '📞 Footer & Contact', icon: Phone },
        ].map((sec) => {
          const isSelected = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. CMS CONTENT PANELS */}

      {/* PANEL 0A: 🎨 LANDING PAGE UI THEME & BACKGROUND COLOR STUDIO */}
      {activeSection === 'landing_theme' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-6 shadow-xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold">
                  <Sliders className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Public Portal Visual Appearance
                </span>
              </div>
              <h4 className="mt-1 text-lg font-black text-white">Public Landing Page Color & Background Studio</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize website canvas background, glowing gradient accents, button shades, and dark/light surface cards.
              </p>
            </div>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all self-start sm:self-auto shadow-md"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Apply & Save Theme</span>
            </button>
          </div>

          {/* Preset Color Themes Palette Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>1-Click Curated Presets:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LANDING_THEME_PRESETS.map((preset) => {
                const isSelected = cmsData.theme?.preset === preset.id || (
                  cmsData.theme?.bg_color === preset.bg_color && cmsData.theme?.accent_color === preset.accent_color
                );
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCmsData({
                      ...cmsData,
                      theme: {
                        bg_color: preset.bg_color,
                        accent_color: preset.accent_color,
                        accent_gradient_to: preset.accent_gradient_to,
                        secondary_color: preset.secondary_color,
                        surface_color: preset.surface_color,
                        surface_border: preset.surface_border,
                        text_color: preset.text_color,
                        preset: preset.id
                      }
                    })}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'border-amber-400 bg-slate-800 shadow-lg ring-2 ring-amber-400/30'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{preset.name}</span>
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{preset.desc}</p>
                    
                    {/* Color Swatch Preview Bar */}
                    <div className="mt-3 flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/5">
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.bg_color }} title={`Background: ${preset.bg_color}`} />
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.surface_color }} title={`Surface: ${preset.surface_color}`} />
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.accent_color }} title={`Accent: ${preset.accent_color}`} />
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.secondary_color }} title={`Secondary: ${preset.secondary_color}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Custom Color Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Fine-Tuned Custom Color Values:
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Background Color */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Page Background Color:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.theme?.bg_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.theme?.bg_color || '#030712'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, bg_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.theme?.bg_color || '#030712'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, bg_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Primary Accent Color */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Primary Brand Accent:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.theme?.accent_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.theme?.accent_color || '#10b981'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, accent_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.theme?.accent_color || '#10b981'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, accent_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Accent Gradient To */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Gradient End Accent:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.theme?.accent_gradient_to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.theme?.accent_gradient_to || '#059669'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, accent_gradient_to: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.theme?.accent_gradient_to || '#059669'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, accent_gradient_to: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Secondary Accent */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Secondary Accent / Badges:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.theme?.secondary_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.theme?.secondary_color || '#f59e0b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, secondary_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.theme?.secondary_color || '#f59e0b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, secondary_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Surface / Card Color */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Surface Card Background:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.theme?.surface_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.theme?.surface_color || '#0f172a'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, surface_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.theme?.surface_color || '#0f172a'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, surface_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Surface Border */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Card Border Outline:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.theme?.surface_border}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.theme?.surface_border || '#1e293b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, surface_border: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.theme?.surface_border || '#1e293b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      theme: { ...cmsData.theme, surface_border: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Live Visual Simulation */}
          <div className="rounded-2xl border border-slate-800 p-4 space-y-3" style={{ backgroundColor: cmsData.theme?.bg_color || '#030712' }}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Live Landing Page Component Simulation:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div 
                className="p-4 rounded-2xl border flex flex-col justify-between space-y-2"
                style={{ 
                  backgroundColor: cmsData.theme?.surface_color || '#0f172a',
                  borderColor: cmsData.theme?.surface_border || '#1e293b'
                }}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${cmsData.theme?.secondary_color || '#f59e0b'}25`,
                      color: cmsData.theme?.secondary_color || '#f59e0b',
                      border: `1px solid ${cmsData.theme?.secondary_color || '#f59e0b'}50`
                    }}
                  >
                    Feature Card Mockup
                  </span>
                  <span className="text-[10px] text-slate-400">Live Render</span>
                </div>
                <h5 className="text-sm font-black" style={{ color: cmsData.theme?.text_color || '#f8fafc' }}>
                  Clothing Size-Color Matrix Engine
                </h5>
                <p className="text-xs text-slate-400">
                  Sub-second apparel variations and automatic barcode hangtag formulations.
                </p>
              </div>

              <div 
                className="p-4 rounded-2xl border flex flex-col justify-center items-center gap-2.5 text-center"
                style={{ 
                  backgroundColor: cmsData.theme?.surface_color || '#0f172a',
                  borderColor: cmsData.theme?.surface_border || '#1e293b'
                }}
              >
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl text-xs font-black shadow-lg transition-transform active:scale-95"
                  style={{
                    background: `linear-gradient(to right, ${cmsData.theme?.accent_color || '#10b981'}, ${cmsData.theme?.accent_gradient_to || '#059669'})`,
                    color: '#030712'
                  }}
                >
                  🚀 Primary Hero CTA Button
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  Accent: {cmsData.theme?.accent_color} → {cmsData.theme?.accent_gradient_to}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 0B: 👑 SUPERADMIN MASTER CONSOLE THEME & BACKGROUND STUDIO */}
      {activeSection === 'superadmin_theme' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-6 shadow-xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-black">
                  <Crown className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  SuperAdmin Central Command Styling
                </span>
              </div>
              <h4 className="mt-1 text-lg font-black text-white">SuperAdmin Console Master Theme & Canvas Studio</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Set master background surface tone, gold/emerald status accents, and card container styling for the SuperAdmin Control Center.
              </p>
            </div>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 active:scale-95 transition-all self-start sm:self-auto shadow-md shadow-amber-500/20"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save SuperAdmin Theme</span>
            </button>
          </div>

          {/* SuperAdmin Theme Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>1-Click Console Presets:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUPERADMIN_THEME_PRESETS.map((preset) => {
                const isSelected = cmsData.superadmin_theme?.preset === preset.id || (
                  cmsData.superadmin_theme?.bg_color === preset.bg_color && cmsData.superadmin_theme?.accent_color === preset.accent_color
                );
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCmsData({
                      ...cmsData,
                      superadmin_theme: {
                        bg_color: preset.bg_color,
                        accent_color: preset.accent_color,
                        surface_color: preset.surface_color,
                        border_color: preset.border_color,
                        text_color: preset.text_color,
                        preset: preset.id
                      }
                    })}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'border-amber-400 bg-slate-800 shadow-lg ring-2 ring-amber-400/30'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{preset.name}</span>
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{preset.desc}</p>
                    
                    <div className="mt-3 flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/5">
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.bg_color }} title={`Background: ${preset.bg_color}`} />
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.surface_color }} title={`Surface: ${preset.surface_color}`} />
                      <div className="h-4 flex-1 rounded" style={{ backgroundColor: preset.accent_color }} title={`Accent: ${preset.accent_color}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Color Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Custom Console Palette Tuning:
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Master Canvas Background:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.superadmin_theme?.bg_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.superadmin_theme?.bg_color || '#030712'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, bg_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.superadmin_theme?.bg_color || '#030712'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, bg_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Master Accent (Gold/Emerald):</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.superadmin_theme?.accent_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.superadmin_theme?.accent_color || '#f59e0b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, accent_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.superadmin_theme?.accent_color || '#f59e0b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, accent_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Card / Surface Panel:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.superadmin_theme?.surface_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.superadmin_theme?.surface_color || '#0f172a'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, surface_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.superadmin_theme?.surface_color || '#0f172a'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, surface_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Card Border Outline:</label>
                  <span className="text-[10px] font-mono text-slate-500">{cmsData.superadmin_theme?.border_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsData.superadmin_theme?.border_color || '#1e293b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, border_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={cmsData.superadmin_theme?.border_color || '#1e293b'}
                    onChange={(e) => setCmsData({
                      ...cmsData,
                      superadmin_theme: { ...cmsData.superadmin_theme, border_color: e.target.value, preset: 'CUSTOM' }
                    })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PANEL 1: SEO & SCHEMA MARKUP */}
      {activeSection === 'seo' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-white">Google SEO & Social Meta Configuration</h4>
            <p className="text-xs text-slate-400">Search engine rankings, OpenGraph WhatsApp cards, and JSON-LD structured data.</p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300">Page Meta Title (Google Title):</label>
              <input
                type="text"
                value={cmsData.seo_meta.title || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  seo_meta: { ...cmsData.seo_meta, title: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Meta Description (Snippet in Google Results):</label>
              <textarea
                rows={2}
                value={cmsData.seo_meta.description || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  seo_meta: { ...cmsData.seo_meta, description: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Search Keywords (Comma Separated):</label>
                <input
                  type="text"
                  value={cmsData.seo_meta.keywords || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    seo_meta: { ...cmsData.seo_meta, keywords: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Canonical Website URL:</label>
                <input
                  type="url"
                  value={cmsData.seo_meta.canonical_url || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    seo_meta: { ...cmsData.seo_meta, canonical_url: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Social Share Image URL (OpenGraph / Twitter):</label>
                <input
                  type="url"
                  value={cmsData.seo_meta.og_image || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    seo_meta: { ...cmsData.seo_meta, og_image: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Robots Meta Tag:</label>
                <input
                  type="text"
                  value={cmsData.seo_meta.robots || 'index, follow'}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    seo_meta: { ...cmsData.seo_meta, robots: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Google Search Live Preview Simulation */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Google Search Snippet Preview:</span>
              <div className="text-blue-400 font-semibold text-sm hover:underline cursor-pointer">
                {cmsData.seo_meta.title || "OmniFlow POS — Cloud Retail & ERP SaaS"}
              </div>
              <div className="text-emerald-400 font-mono text-[11px]">
                {cmsData.seo_meta.canonical_url || "https://omniflow.pos.bd"}
              </div>
              <div className="text-slate-300 text-xs line-clamp-2">
                {cmsData.seo_meta.description || "Sub-second POS and garment size-color matrix engine for Bangladesh retail fashion brands."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: HERO & ANNOUNCEMENT */}
      {activeSection === 'hero' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-white">Hero Section & Announcement Top Banner</h4>
            <p className="text-xs text-slate-400">Headlines, call-to-action buttons and key value metrics.</p>
          </div>

          {/* Announcement Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Top Announcement Banner</span>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cmsData.announcement.is_visible !== false}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, is_visible: e.target.checked }
                  })}
                  className="rounded text-amber-500"
                />
                <span>Show Banner</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Badge Text:</label>
                <input
                  type="text"
                  value={cmsData.announcement.badge || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, badge: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-400">Message Text:</label>
                <input
                  type="text"
                  value={cmsData.announcement.text || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    announcement: { ...cmsData.announcement, text: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300">Hero Eyebrow Tag:</label>
              <input
                type="text"
                value={cmsData.hero.eyebrow || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  hero: { ...cmsData.hero, eyebrow: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Headline Line 1:</label>
                <input
                  type="text"
                  value={cmsData.hero.headline_line1 || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, headline_line1: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">Headline Gradient / Highlight:</label>
                <input
                  type="text"
                  value={cmsData.hero.headline_gradient || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, headline_gradient: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-amber-300 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Subheadline Paragraph:</label>
              <textarea
                rows={3}
                value={cmsData.hero.subheadline || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  hero: { ...cmsData.hero, subheadline: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Primary CTA Button Text:</label>
                <input
                  type="text"
                  value={cmsData.hero.cta_primary_text || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, cta_primary_text: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">Secondary CTA Button Text:</label>
                <input
                  type="text"
                  value={cmsData.hero.cta_secondary_text || ''}
                  onChange={(e) => setCmsData({
                    ...cmsData,
                    hero: { ...cmsData.hero, cta_secondary_text: e.target.value }
                  })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: CORE FEATURE CAPABILITIES */}
      {activeSection === 'features' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-white">Interactive Feature Capability Modules</h4>
              <p className="text-xs text-slate-400">Manage apparel matrix, POS billing, 2FA attendance & stock transfer showcases.</p>
            </div>
            <button
              type="button"
              onClick={handleAddFeature}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="space-y-4">
            {cmsData.features.map((feat, idx) => (
              <div key={feat.id || idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="rounded bg-amber-400/20 text-amber-300 font-mono font-bold text-[11px] px-2 py-0.5">
                    Module #{idx + 1}: {feat.tab_label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                    title="Remove Module"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Tab Button Label:</label>
                    <input
                      type="text"
                      value={feat.tab_label || ''}
                      onChange={(e) => {
                        const updated = [...cmsData.features];
                        updated[idx].tab_label = e.target.value;
                        setCmsData({ ...cmsData, features: updated });
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Badge Tag:</label>
                    <input
                      type="text"
                      value={feat.badge || ''}
                      onChange={(e) => {
                        const updated = [...cmsData.features];
                        updated[idx].badge = e.target.value;
                        setCmsData({ ...cmsData, features: updated });
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Main Title:</label>
                  <input
                    type="text"
                    value={feat.title || ''}
                    onChange={(e) => {
                      const updated = [...cmsData.features];
                      updated[idx].title = e.target.value;
                      setCmsData({ ...cmsData, features: updated });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">Description:</label>
                  <textarea
                    rows={2}
                    value={feat.description || ''}
                    onChange={(e) => {
                      const updated = [...cmsData.features];
                      updated[idx].description = e.target.value;
                      setCmsData({ ...cmsData, features: updated });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL 4: CLIENT TESTIMONIALS */}
      {activeSection === 'testimonials' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-white">Client Testimonials & Social Proof</h4>
              <p className="text-xs text-slate-400">Highlight reviews from boutique fashion founders and operations managers.</p>
            </div>
            <button
              type="button"
              onClick={handleAddTestimonial}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Review</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cmsData.testimonials.map((t, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-bold text-amber-400">Review #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestimonial(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                    title="Remove Review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={t.client_name || ''}
                    onChange={(e) => {
                      const updated = [...cmsData.testimonials];
                      updated[idx].client_name = e.target.value;
                      setCmsData({ ...cmsData, testimonials: updated });
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Operations Head)"
                    value={t.role || ''}
                    onChange={(e) => {
                      const updated = [...cmsData.testimonials];
                      updated[idx].role = e.target.value;
                      setCmsData({ ...cmsData, testimonials: updated });
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Brand (e.g. Vogue Lifestyle)"
                    value={t.brand || ''}
                    onChange={(e) => {
                      const updated = [...cmsData.testimonials];
                      updated[idx].brand = e.target.value;
                      setCmsData({ ...cmsData, testimonials: updated });
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Location (e.g. Dhanmondi, Dhaka)"
                    value={t.location || ''}
                    onChange={(e) => {
                      const updated = [...cmsData.testimonials];
                      updated[idx].location = e.target.value;
                      setCmsData({ ...cmsData, testimonials: updated });
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Review quote..."
                  value={t.quote || ''}
                  onChange={(e) => {
                    const updated = [...cmsData.testimonials];
                    updated[idx].quote = e.target.value;
                    setCmsData({ ...cmsData, testimonials: updated });
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL 5: FAQS */}
      {activeSection === 'faqs' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-white">Frequently Asked Questions (FAQ)</h4>
              <p className="text-xs text-slate-400">Help prospects understand pricing, matrix setup, and biometric security.</p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add FAQ</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {cmsData.faqs.map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Q#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                    title="Remove Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Question..."
                  value={faq.question || ''}
                  onChange={(e) => {
                    const updated = [...cmsData.faqs];
                    updated[idx].question = e.target.value;
                    setCmsData({ ...cmsData, faqs: updated });
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Detailed Answer..."
                  value={faq.answer || ''}
                  onChange={(e) => {
                    const updated = [...cmsData.faqs];
                    updated[idx].answer = e.target.value;
                    setCmsData({ ...cmsData, faqs: updated });
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL 6: FOOTER & CONTACT */}
      {activeSection === 'footer' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-white">Footer, Hotline & Company Coordinates</h4>
            <p className="text-xs text-slate-400">Office location, customer support helpline and copyright notice.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300">Company Name:</label>
              <input
                type="text"
                value={cmsData.footer.company_name || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  footer: { ...cmsData.footer, company_name: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Tagline / Subtitle:</label>
              <input
                type="text"
                value={cmsData.footer.tagline || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  footer: { ...cmsData.footer, tagline: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Support Hotline / Phone:</label>
              <input
                type="text"
                value={cmsData.footer.hotline || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  footer: { ...cmsData.footer, hotline: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Support Email:</label>
              <input
                type="email"
                value={cmsData.footer.email || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  footer: { ...cmsData.footer, email: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">Dhaka Office Physical Address:</label>
              <input
                type="text"
                value={cmsData.footer.address || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  footer: { ...cmsData.footer, address: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">Copyright Text:</label>
              <input
                type="text"
                value={cmsData.footer.copyright || ''}
                onChange={(e) => setCmsData({
                  ...cmsData,
                  footer: { ...cmsData.footer, copyright: e.target.value }
                })}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
