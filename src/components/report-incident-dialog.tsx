"use client";

import { useState, useRef } from "react";
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
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitUserReport, type UserReport } from "@/services/incidents";
import { GeoPoint } from "firebase/firestore";

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

  const handleClose = () => {
    onOpenChange(false);
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
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: true,
        });
      });

      const location = new GeoPoint(position.coords.latitude, position.coords.longitude);

      const reportData: UserReport = {
        type: values.type,
        description: values.description,
        location: location,
        // In a real app, you would upload the file to cloud storage
        // and get a URL. For now, we'll use a placeholder.
        mediaUrls: values.media ? ["testimage"] : [],
      };

      await submitUserReport(reportData);
      
      toast({
        title: "Report Submitted",
        description: "Thank you for helping improve your city!",
      });
      handleClose();
    } catch (error: any) {
      console.error("Submission failed", error);
       if (error.code === error.PERMISSION_DENIED) {
         toast({
          variant: "destructive",
          title: "Location Access Denied",
          description: "Please enable location permissions to submit a report.",
        });
       } else {
         toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "Could not submit your report. Please try again.",
        });
       }
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
                Help improve your city by filling out the details below.
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
            
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
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
