/**
 * Dashboard Template Gallery Component
 * 
 * Displays available dashboard templates in a modal dialog
 * Allows users to select and apply pre-configured dashboards
 */

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { dashboardTemplates } from "@/lib/templates/dashboardTemplates";
import type { DashboardTemplate } from "@/lib/types/dashboard";
import { toast } from "sonner";
import { 
  LayoutTemplate, 
  TrendingUp, 
  BarChart3, 
  Check,
  AlertTriangle,
  Eye,
  Grid3x3,
  X,
  Layers,
  Table as TableIcon,
  LineChart as LineChartIcon,
  CreditCard
} from "lucide-react";

/**
 * Props for TemplateGallery component
 */
interface TemplateGalleryProps {
  /** Optional custom trigger button */
  trigger?: React.ReactNode;
  /** Callback after template is applied */
  onTemplateApplied?: (template: DashboardTemplate) => void;
}

/**
 * Template card icons mapping
 */
const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "stock-portfolio-dashboard": TrendingUp,
  "market-overview-dashboard": BarChart3,
};

/**
 * Template Gallery Component
 * 
 * Features:
 * - Displays all available templates in a grid
 * - Shows template name, description, and widget count
 * - Confirms before replacing existing dashboard
 * - Applies template using store.applyTemplate()
 * - Shows success/error toasts
 * 
 * Template Application Flow:
 * 1. User clicks "Use Template" button
 * 2. If widgets exist, show confirmation dialog
 * 3. Call store.applyTemplate(template)
 * 4. Template widgets are hydrated into dashboard state
 * 5. Close modal and show success toast
 */
export default function TemplateGallery({ 
  trigger, 
  onTemplateApplied 
}: TemplateGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const { widgets, applyTemplate } = useDashboardStore();
  const hasExistingWidgets = widgets.length > 0;
  /**
   * Open preview modal for a template
   */
  const handlePreviewTemplate = (template: DashboardTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  /**
   * Handle template selection from preview
   * Shows confirmation if dashboard has existing widgets
   */
  const handleSelectTemplate = (template: DashboardTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(false); // Close preview
    
    if (hasExistingWidgets) {
      setShowConfirm(true);
    } else {
      handleConfirmApply(template);
    }
  };

  /**
   * Get icon for widget type
   */
  const getWidgetTypeIcon = (type: string) => {
    switch (type) {
      case 'card':
        return CreditCard;
      case 'table':
        return TableIcon;
      case 'chart':
        return LineChartIcon;
      default:
        return Layers;
    }
  };

  /**
   * Apply the selected template
   * 
   * This calls store.applyTemplate() which:
   * - Clears all existing widgets
   * - Loads template widgets with generated IDs
   * - Sets up layout configuration
   * - Persists to localStorage
   * 
   * After application, widgets behave exactly like user-created widgets:
   * - Can be edited via existing edit dialog
   * - Can be deleted via existing delete action
   * - Can be rearranged via drag-and-drop
   * - Will auto-refresh based on refreshInterval
   */
  const handleConfirmApply = (template: DashboardTemplate) => {
    try {
      // Apply template - this replaces dashboard state with template widgets
      applyTemplate(template);
      
      // Show success notification
      toast.success(
        `Template Applied!`,
        {
          description: `${template.name} has been added to your dashboard.`,
        }
      );

      // Callback for parent component
      if (onTemplateApplied) {
        onTemplateApplied(template);
      }
      
      // Close dialogs
      setShowConfirm(false);
      setIsOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Failed to apply template:", error);
      toast.error(
        "Failed to apply template",
        {
          description: "Please try again or contact support.",
        }
      );
    }
  };

  /**
   * Cancel template application
   */
  const handleCancelApply = () => {
    setShowConfirm(false);
    setSelectedTemplate(null);
  };

  /**
   * Close preview modal
   */
  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedTemplate(null);
  };

  return (
    <>
      {/* Main Template Gallery Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Browse Templates
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Dashboard Templates
            </DialogTitle>
            <DialogDescription>
              Choose a pre-configured dashboard template to get started quickly.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className={`py-4 ${dashboardTemplates.length === 1 ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
              {dashboardTemplates.map((template) => {
                const Icon = templateIcons[template.id] || LayoutTemplate;
                
                return (
                  <Card 
                    key={template.id}
                    className={`hover:shadow-lg transition-all border-2 hover:border-primary/50 flex flex-col ${dashboardTemplates.length === 1 ? 'max-w-md w-full' : ''}`}
                  >
                    <CardHeader className="pb-3 space-y-2">
                      <CardTitle className="flex items-start gap-2 text-base leading-tight">
                        <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2 break-words">{template.name}</span>
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 mt-auto">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Grid3x3 className="h-4 w-4 shrink-0" />
                            <span>{template.widgets.length} widget{template.widgets.length !== 1 ? 's' : ''}</span>
                          </div>
                          {template.category && (
                            <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium">
                              {template.category}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 min-w-0 justify-center"
                            onClick={(e) => handlePreviewTemplate(template, e)}
                          >
                            <Eye className="h-4 w-4 shrink-0" />
                            <span className="ml-1.5">Preview</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default"
                            className="flex-1 min-w-0 justify-center"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <Check className="h-4 w-4 shrink-0" />
                            <span className="ml-1.5">Use</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                </Card>
              );
            })}
          </div>

          {dashboardTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <LayoutTemplate className="h-16 w-16 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No templates available yet.</p>
              <p className="text-sm mt-1">Check back later for pre-configured dashboards.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Template Preview
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClosePreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            {selectedTemplate && (
              <DialogDescription>
                {selectedTemplate.name} - {selectedTemplate.widgets.length} widgets
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedTemplate && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Template Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {templateIcons[selectedTemplate.id] && (
                      React.createElement(templateIcons[selectedTemplate.id], {
                        className: "h-6 w-6 text-primary"
                      })
                    )}
                    <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                  {selectedTemplate.category && (
                    <span className="inline-block bg-secondary px-3 py-1 rounded-md text-xs font-medium">
                      {selectedTemplate.category}
                    </span>
                  )}
                </div>

                <Separator />

                {/* Widgets List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Included Widgets ({selectedTemplate.widgets.length})
                  </h4>
                  
                  <div className="space-y-2">
                    {selectedTemplate.widgets.map((widget, index) => {
                      const WidgetIcon = getWidgetTypeIcon(widget.type);
                      const fieldCount = widget.config.type === 'chart' 
                        ? 'Chart visualization'
                        : `${(widget.config as any).fields?.length || 0} fields`;
                      
                      return (
                        <Card key={index} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <WidgetIcon className="h-4 w-4 text-primary" />
                                  <h5 className="font-medium">{widget.title}</h5>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="capitalize bg-secondary px-2 py-0.5 rounded">
                                    {widget.type}
                                  </span>
                                  <span>{fieldCount}</span>
                                  <span>Size: {widget.layout.w}×{widget.layout.h}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Data: {widget.config.apiEndpoint}
                                </p>
                              </div>
                            </div>
                            
                            {/* Show fields for card/table widgets */}
                            {widget.config.type !== 'chart' && (widget.config as any).fields && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium mb-2">Fields:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(widget.config as any).fields.slice(0, 6).map((field: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-muted px-2 py-1 rounded"
                                    >
                                      {field.name}
                                    </span>
                                  ))}
                                  {(widget.config as any).fields.length > 6 && (
                                    <span className="text-xs text-muted-foreground px-2 py-1">
                                      +{(widget.config as any).fields.length - 6} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClosePreview}>
              Close
            </Button>
            <Button 
              variant="default" 
              onClick={() => selectedTemplate && handleSelectTemplate(selectedTemplate)}
            >
              <Check className="mr-2 h-4 w-4" />
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Replace Existing Dashboard?
            </DialogTitle>
            <DialogDescription>
              You currently have {widgets.length} widget{widgets.length !== 1 ? 's' : ''} on your dashboard.
              Applying this template will replace all existing widgets.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedTemplate.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {selectedTemplate.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This template includes {selectedTemplate.widgets.length} pre-configured widgets.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelApply}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => selectedTemplate && handleConfirmApply(selectedTemplate)}
            >
              <Check className="mr-2 h-4 w-4" />
              Apply Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
