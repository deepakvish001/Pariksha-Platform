import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Shield,
  Star,
  FileText,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ResumeTemplate, styleConfig, resumeTemplates } from "@/data/resumeTemplatesData";
import FormatDownloadButton from "./FormatDownloadButton";

interface ResumePreviewModalProps {
  template: ResumeTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (template: ResumeTemplate, format: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (templateId: number) => void;
}

// Image-based preview component (uses actual uploaded images)
const ImagePreview: React.FC<{ template: ResumeTemplate; zoom: number }> = ({
  template,
  zoom,
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  if (!template.previewUrl || imageError) {
    return <FallbackResumePreview template={template} zoom={zoom} />;
  }

  return (
    <div
      className="bg-gray-100 rounded-lg shadow-inner overflow-auto flex justify-center p-4"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
    >
      <div className="w-[500px] shadow-2xl rounded-lg overflow-hidden bg-white">
        <img
          src={template.previewUrl}
          alt={`${template.name} preview`}
          className="w-full h-auto object-contain"
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  );
};

// Full resume preview component with realistic content (fallback)
const FallbackResumePreview: React.FC<{ template: ResumeTemplate; zoom: number }> = ({
  template,
  zoom,
}) => {
  const style = styleConfig[template.style];

  const layouts = {
    modern: (
      <div className="bg-white text-gray-900 p-8 min-h-[800px]">
        {/* Header with color accent */}
        <div className={cn("h-2 w-full -mx-8 -mt-8 mb-6 bg-gradient-to-r", style.gradient)} />
        <div className="flex gap-6 mb-6">
          <div className={cn("h-24 w-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold", style.gradient)}>
            JD
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">John Doe</h1>
            <p className="text-lg text-gray-600 mb-2">Senior Software Engineer</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>📧 john.doe@email.com</span>
              <span>📱 +1 (555) 123-4567</span>
              <span>📍 San Francisco, CA</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <section>
            <h2 className={cn("text-lg font-semibold border-b-2 pb-1 mb-3", `border-blue-500`)}>
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Results-driven software engineer with 8+ years of experience building scalable applications. 
              Expert in React, TypeScript, and cloud technologies. Led teams of 5-10 engineers to deliver 
              products used by millions of users worldwide.
            </p>
          </section>
          
          <section>
            <h2 className={cn("text-lg font-semibold border-b-2 pb-1 mb-3", `border-blue-500`)}>
              Experience
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <h3 className="font-semibold">Senior Software Engineer</h3>
                  <span className="text-gray-500 text-sm">2020 - Present</span>
                </div>
                <p className="text-gray-600">Tech Company Inc.</p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 text-sm">
                  <li>Led development of microservices architecture serving 10M+ daily requests</li>
                  <li>Reduced deployment time by 60% through CI/CD pipeline improvements</li>
                  <li>Mentored junior developers and conducted code reviews</li>
                </ul>
              </div>
              <div>
                <div className="flex justify-between">
                  <h3 className="font-semibold">Software Engineer</h3>
                  <span className="text-gray-500 text-sm">2017 - 2020</span>
                </div>
                <p className="text-gray-600">Startup Labs</p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 text-sm">
                  <li>Built React Native mobile app with 100K+ downloads</li>
                  <li>Implemented real-time collaboration features using WebSockets</li>
                </ul>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className={cn("text-lg font-semibold border-b-2 pb-1 mb-3", `border-blue-500`)}>
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "PostgreSQL", "GraphQL"].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </section>
          
          <section>
            <h2 className={cn("text-lg font-semibold border-b-2 pb-1 mb-3", `border-blue-500`)}>
              Education
            </h2>
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">Bachelor of Science in Computer Science</h3>
                <p className="text-gray-600">Stanford University</p>
              </div>
              <span className="text-gray-500 text-sm">2013 - 2017</span>
            </div>
          </section>
        </div>
      </div>
    ),
    traditional: (
      <div className="bg-white text-gray-900 p-8 min-h-[800px]">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-serif font-bold tracking-wide">JOHN DOE</h1>
          <p className="text-gray-600 mt-1">Senior Executive | Business Strategy | Leadership</p>
          <div className="flex justify-center gap-6 mt-2 text-sm text-gray-500">
            <span>john.doe@email.com</span>
            <span>|</span>
            <span>+1 (555) 123-4567</span>
            <span>|</span>
            <span>New York, NY</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">
              EXECUTIVE SUMMARY
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Accomplished executive with 15+ years of experience driving organizational growth and 
              operational excellence. Proven track record of leading Fortune 500 initiatives and 
              delivering $50M+ in cost savings through strategic transformation.
            </p>
          </section>
          
          <section>
            <h2 className="text-sm font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">
              PROFESSIONAL EXPERIENCE
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold">CHIEF OPERATIONS OFFICER</h3>
                  <span className="text-gray-600 text-sm">2018 - Present</span>
                </div>
                <p className="text-gray-600 italic">Global Enterprises Corporation, New York, NY</p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 text-sm">
                  <li>Oversaw operations across 12 countries with 5,000+ employees</li>
                  <li>Achieved 25% revenue growth through market expansion strategy</li>
                  <li>Led digital transformation initiative resulting in 40% efficiency gains</li>
                </ul>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-sm font-bold tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-3">
              EDUCATION
            </h2>
            <div>
              <p className="font-bold">Master of Business Administration (MBA)</p>
              <p className="text-gray-600">Harvard Business School, 2008</p>
            </div>
          </section>
        </div>
      </div>
    ),
    creative: (
      <div className="bg-white text-gray-900 min-h-[800px] flex">
        <div className={cn("w-1/3 p-6 text-white bg-gradient-to-b", style.gradient)}>
          <div className="h-32 w-32 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center text-3xl font-bold">
            JD
          </div>
          <h1 className="text-xl font-bold text-center mb-1">John Doe</h1>
          <p className="text-sm text-center opacity-80 mb-6">Creative Director</p>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Contact</h3>
              <div className="space-y-1 opacity-80">
                <p>📧 john@creative.com</p>
                <p>📱 +1 555 123 4567</p>
                <p>🌐 johndoe.design</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="space-y-1 opacity-80">
                <p>Adobe Creative Suite</p>
                <p>Figma & Sketch</p>
                <p>Motion Design</p>
                <p>Brand Strategy</p>
                <p>3D Modeling</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Languages</h3>
              <div className="space-y-1 opacity-80">
                <p>English (Native)</p>
                <p>Spanish (Fluent)</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-8">
          <section className="mb-6">
            <h2 className="text-lg font-bold text-pink-600 mb-2">About Me</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Award-winning creative director with 10+ years crafting memorable brand experiences. 
              Passionate about pushing boundaries and creating work that resonates emotionally 
              while driving business results.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-lg font-bold text-pink-600 mb-3">Experience</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-pink-300 pl-4">
                <h3 className="font-semibold">Creative Director</h3>
                <p className="text-sm text-pink-600">Design Agency • 2019 - Present</p>
                <p className="text-gray-600 text-sm mt-1">
                  Leading creative team of 15, delivering campaigns for global brands including Nike, Apple, and Spotify.
                </p>
              </div>
              <div className="border-l-2 border-pink-300 pl-4">
                <h3 className="font-semibold">Senior Designer</h3>
                <p className="text-sm text-pink-600">Creative Studio • 2015 - 2019</p>
                <p className="text-gray-600 text-sm mt-1">
                  Award-winning designs for product launches and brand identities.
                </p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-pink-600 mb-2">Awards</h2>
            <div className="flex flex-wrap gap-2">
              {["Cannes Lions 2022", "D&AD Gold", "Webby Award"].map((award) => (
                <span key={award} className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs">
                  🏆 {award}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    ),
    minimal: (
      <div className="bg-white text-gray-900 p-10 min-h-[800px]">
        <h1 className="text-4xl font-light tracking-tight mb-1">John Doe</h1>
        <p className="text-gray-500 mb-6">Product Designer</p>
        
        <div className="text-sm text-gray-500 mb-8 flex gap-6">
          <span>john@example.com</span>
          <span>San Francisco</span>
          <span>johndoe.com</span>
        </div>
        
        <div className="space-y-8">
          <section>
            <p className="text-gray-700 leading-relaxed">
              Designer focused on creating intuitive, user-centered experiences. 
              7 years of experience working with startups and enterprises to build 
              products that users love.
            </p>
          </section>
          
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Experience</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Lead Product Designer</span>
                  <span className="text-gray-400">2021 — Present</span>
                </div>
                <p className="text-gray-500 text-sm">Stripe</p>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Senior Designer</span>
                  <span className="text-gray-400">2018 — 2021</span>
                </div>
                <p className="text-gray-500 text-sm">Airbnb</p>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Designer</span>
                  <span className="text-gray-400">2016 — 2018</span>
                </div>
                <p className="text-gray-500 text-sm">Google</p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Education</h2>
            <div className="text-sm">
              <span className="font-medium">BFA Design</span>
              <span className="text-gray-400"> — RISD, 2016</span>
            </div>
          </section>
        </div>
      </div>
    ),
    "two-column": (
      <div className="bg-white text-gray-900 min-h-[800px] flex p-6 gap-6">
        <div className="w-2/5 space-y-6">
          <div className="text-center">
            <div className="h-20 w-20 rounded-lg bg-teal-100 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-teal-700">
              JD
            </div>
            <h1 className="text-xl font-bold">John Doe</h1>
            <p className="text-teal-600 text-sm">Full Stack Developer</p>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-teal-700 mb-2">CONTACT</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>📧 john@developer.com</p>
              <p>📱 +1 555 123 4567</p>
              <p>💼 linkedin.com/in/johndoe</p>
              <p>🐙 github.com/johndoe</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-teal-700 mb-2">SKILLS</h3>
            <div className="space-y-2">
              {[
                { skill: "JavaScript/TypeScript", level: 95 },
                { skill: "React/Next.js", level: 90 },
                { skill: "Node.js", level: 85 },
                { skill: "Python", level: 80 },
                { skill: "AWS/Cloud", level: 75 },
              ].map((item) => (
                <div key={item.skill}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{item.skill}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-teal-500 rounded-full" 
                      style={{ width: `${item.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-teal-700 mb-2">EDUCATION</h3>
            <div className="text-xs">
              <p className="font-medium">BS Computer Science</p>
              <p className="text-gray-500">MIT • 2016</p>
            </div>
          </div>
        </div>
        
        <div className="w-px bg-gray-200" />
        
        <div className="flex-1 space-y-6">
          <section>
            <h2 className="text-sm font-bold text-teal-700 mb-2">PROFILE</h2>
            <p className="text-xs text-gray-700 leading-relaxed">
              Full stack developer with 6+ years building web applications at scale. 
              Passionate about clean code, performance optimization, and mentoring junior developers.
            </p>
          </section>
          
          <section>
            <h2 className="text-sm font-bold text-teal-700 mb-3">EXPERIENCE</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold">Senior Software Engineer</h3>
                  <span className="text-xs text-gray-400">2021 - Present</span>
                </div>
                <p className="text-xs text-teal-600 mb-1">Meta</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li>• Built core features for Messenger serving 1B+ users</li>
                  <li>• Led migration to React 18 improving performance by 30%</li>
                  <li>• Mentored team of 5 engineers</li>
                </ul>
              </div>
              <div>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-semibold">Software Engineer</h3>
                  <span className="text-xs text-gray-400">2018 - 2021</span>
                </div>
                <p className="text-xs text-teal-600 mb-1">Uber</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li>• Developed real-time tracking features</li>
                  <li>• Reduced API latency by 40%</li>
                </ul>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-sm font-bold text-teal-700 mb-2">PROJECTS</h2>
            <div className="text-xs text-gray-700">
              <p className="font-medium">Open Source CLI Tool</p>
              <p className="text-gray-500">5K+ GitHub stars • npm downloads 100K+</p>
            </div>
          </section>
        </div>
      </div>
    ),
  };

  return (
    <div
      className="bg-gray-100 rounded-lg shadow-inner overflow-auto"
      style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
    >
      <div className="w-[600px] mx-auto shadow-xl">
        {layouts[template.style] || layouts.modern}
      </div>
    </div>
  );
};

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onDownload,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [zoom, setZoom] = React.useState(0.9);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (template) {
      const index = resumeTemplates.findIndex((t) => t.id === template.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [template]);

  const currentTemplate = resumeTemplates[currentIndex];
  const style = currentTemplate ? styleConfig[currentTemplate.style] : null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : resumeTemplates.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < resumeTemplates.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  if (!currentTemplate || !style) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Preview Area */}
          <div className="flex-1 bg-muted/30 relative overflow-hidden">
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={goToPrevious}
              aria-label="Previous template"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={goToNext}
              aria-label="Next template"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview Content */}
            <div className="h-full overflow-auto p-8 pt-16">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTemplate.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ImagePreview template={currentTemplate} zoom={zoom} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Template Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {resumeTemplates.length}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-background p-6 flex flex-col">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{currentTemplate.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentTemplate.description}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant="secondary"
                className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  style.gradient
                )}
              >
                {style.label}
              </Badge>
              {currentTemplate.atsCompatible && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  <Shield className="h-3 w-3" />
                  ATS Friendly
                </Badge>
              )}
              {currentTemplate.isFeatured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{(currentTemplate.downloads / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">Downloads</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{currentTemplate.fileSize}</p>
                <p className="text-xs text-muted-foreground">File Size</p>
              </div>
            </div>

            {/* Available Formats */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">Available Formats</h4>
              <div className="flex flex-wrap gap-1.5">
                {currentTemplate.format.map((fmt) => (
                  <span
                    key={fmt}
                    className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">Best For</h4>
              <div className="flex flex-wrap gap-1.5">
                {currentTemplate.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-3">
              {/* Download with Format Selection */}
              <FormatDownloadButton
                template={currentTemplate}
                onDownload={onDownload}
              />

              {/* Favorite Button */}
              {onToggleFavorite && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => onToggleFavorite(currentTemplate.id)}
                >
                  {isFavorite ? (
                    <>
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      Saved to Favorites
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4" />
                      Add to Favorites
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;
