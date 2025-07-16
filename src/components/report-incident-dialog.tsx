"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReportIncidentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    category: string;
    description: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string | undefined>();
  const [description, setDescription] = useState<string | undefined>();

  useEffect(() => {
    if (aiSuggestions) {
      setCategory(aiSuggestions.category);
      setDescription(aiSuggestions.description);
    }
  }, [aiSuggestions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setIsAiLoading(true);
      setAiSuggestions(null);
      setCategory(undefined);
      setDescription(undefined);

      setTimeout(() => {
        setAiSuggestions({
          category: "traffic",
          description:
            "AI suggestion: A red car appears to be blocking the intersection, causing a significant traffic jam. Recommend immediate dispatch.",
        });
        setIsAiLoading(false);
      }, 2000);
    }
  };

  const resetState = () => {
    setIsAiLoading(false);
    setAiSuggestions(null);
    setSelectedFile(null);
    setCategory(undefined);
    setDescription(undefined);
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
        title: "Report Submitted",
        description: "Thank you for helping improve your city!",
    });
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report an Incident</DialogTitle>
            <DialogDescription>
              Help improve your city. Attach a photo for AI-assisted reporting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label>Media (Photo/Video)</Label>
              <Button asChild variant="outline" className="w-full">
                <label
                  htmlFor="media-upload"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {selectedFile ? selectedFile.name : "Upload Media"}
                </label>
              </Button>
              <Input
                id="media-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*,video/*"
              />
              {isAiLoading && (
                <div className="flex items-center text-sm text-muted-foreground gap-2 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing media with AI...
                </div>
              )}
            </div>
            {aiSuggestions && (
              <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-r-md">
                <p className="font-bold flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" /> AI Suggestions
                </p>
                <p className="text-sm mt-1 text-primary/90">
                  {aiSuggestions.description}
                </p>
                <p className="text-sm mt-1 text-primary/90">
                  Category set to:{" "}
                  <span className="font-semibold capitalize">
                    {aiSuggestions.category}
                  </span>
                </p>
              </div>
            )}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the incident..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
