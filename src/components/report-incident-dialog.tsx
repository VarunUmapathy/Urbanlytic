"use client";

import { useState, useRef } from "react";
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
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitUserReport, uploadFile, type UserReport } from "@/services/incidents";
import { GeoPoint } from "firebase/firestore";
import { cn } from "@/lib/utils";

const ReportSchema = z.object({
  type: z.enum(
    ["traffic", "safety", "infrastructure", "pothole", "accident", "road_hazard", "public_disturbance"],
    { required_error: "Please select a category." }
  ),
  description: z.string().min(10, "Description must be at least 10 characters."),
  media: z.instanceof(File).optional(),
});

type ReportFormValues = z.infer<typeof ReportSchema>;

export function ReportIncidentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      form.setValue("media", file);
      setSelectedFileName(file.name);
    }
  };
  
  const onSubmit = async (values: ReportFormValues) => {
    setIsSubmitting(true);
    let location: GeoPoint;
    let mediaUrl = "";

    try {
      // Step 1: Get Location
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
          });
        });
        location = new GeoPoint(position.coords.latitude, position.coords.longitude);
      } catch (error: any) {
        throw new Error(`Location Error: ${error.message}`);
      }

      // Step 2: Upload Media if it exists
      if (values.media) {
        try {
          mediaUrl = await uploadFile(values.media);
        } catch (error: any) {
          throw new Error(`File Upload Error: ${error.message}`);
        }
      }

      // Step 3: Submit the final report
      const reportData: UserReport = {
        type: values.type,
        description: values.description,
        location: location,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
      };

      try {
        const { success, error } = await submitUserReport(reportData);
        if (!success) {
          throw error || new Error("An unknown error occurred during submission.");
        }
      } catch (error: any) {
        throw new Error(`Submission Error: ${error.message}`);
      }
      
      toast({
        title: "Report Submitted",
        description: "Thank you for helping improve your city!",
      });
      handleClose(false);

    } catch (error: any) {
      console.error("Submission failed", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Could not submit your report. Please try again.",
        duration: 9000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-40 bg-black/50 transition-opacity flex items-center justify-center p-4",
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={() => handleClose(false)}
    >
      <div
        className="w-full max-w-md bg-background rounded-xl shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-6 pb-2 text-left">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Report an Incident</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Help improve your city by filling out the details below.
              </p>
            </div>
            
            <div className="grid gap-4 px-6">
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
                  disabled={isSubmitting}
                />
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
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
