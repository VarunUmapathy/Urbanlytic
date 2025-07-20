"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitUserReport } from "@/services/incidents";
import { GeoPoint } from "firebase/firestore";
import { suggestIncidentReport } from "@/ai/flows/suggest-incident-report";
import type { IncidentType } from "@/lib/types";

const ReportSchema = z.object({
  type: z.enum(
    ["traffic", "safety", "infrastructure", "pothole", "accident", "road_hazard", "public_disturbance"],
    { required_error: "Please select a category." }
  ),
  description: z.string().min(10, "Description must be at least 10 characters."),
  media: z.instanceof(File).optional(),
});

type ReportFormValues = z.infer<typeof ReportSchema>;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReportIncidentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      description: "",
    },
  });

  const resetState = () => {
    form.reset();
    setIsSubmitting(false);
    setIsAiLoading(false);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      form.setValue("media", file);
      setSelectedFileName(file.name);
      setIsAiLoading(true);

      try {
        const photoDataUri = await fileToDataUrl(file);
        const suggestions = await suggestIncidentReport({
          photoDataUri: photoDataUri,
        });
        
        form.setValue("type", suggestions.type as IncidentType);
        form.setValue("description", suggestions.description);
        
        toast({
          title: "AI Suggestions Applied",
          description: "Category and description have been filled out for you.",
          className: "bg-primary/10 border-primary text-primary",
        });

      } catch (error) {
        console.error("AI suggestion failed:", error);
        toast({
          variant: "destructive",
          title: "AI Analysis Failed",
          description: "Could not get suggestions. Please fill out the form manually.",
        });
      } finally {
        setIsAiLoading(false);
      }
    }
  };
  
  const onSubmit = async (values: ReportFormValues) => {
    setIsSubmitting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const location = new GeoPoint(position.coords.latitude, position.coords.longitude);

      await submitUserReport({
        type: values.type,
        description: values.description,
        location: location,
        // In a real app, you would upload the file to cloud storage
        // and get a URL. For now, we'll use a placeholder.
        mediaUrls: values.media ? ["testimage"] : [],
      });
      
      toast({
        title: "Report Submitted",
        description: "Thank you for helping improve your city!",
      });
      handleClose();
    } catch (error) {
      console.error("Submission failed", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not submit your report. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()} onAnimationEnd={() => !open && resetState()}>
      <DialogContent className="sm:max-w-[425px] w-[calc(100%-2rem)] sm:w-full bottom-0 sm:bottom-auto translate-y-0 sm:-translate-y-1/2 rounded-b-none sm:rounded-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Report an Incident</DialogTitle>
              <DialogDescription>
                Help improve your city. Attach a photo for AI-assisted reporting.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <FormLabel>Media (Photo/Video)</FormLabel>
                <Button asChild variant="outline" className="w-full">
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {selectedFileName || "Upload Media"}
                  </label>
                </Button>
                <Input
                  id="media-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept="image/*"
                  ref={fileInputRef}
                  disabled={isAiLoading || isSubmitting}
                />
                {isAiLoading && (
                  <div className="flex items-center text-sm text-muted-foreground gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <Sparkles className="h-4 w-4 text-primary" />
                    Analyzing media with AI...
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="traffic">Traffic</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="pothole">Pothole</SelectItem>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="road_hazard">Road Hazard</SelectItem>
                        <SelectItem value="public_disturbance">Public Disturbance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the incident..."
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || isAiLoading}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
