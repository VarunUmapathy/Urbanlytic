
"use client";

import { useEffect, useState } from "react";
import { PhoneLayout } from "@/components/phone-layout";
import { Header } from "@/components/header";
import { analyticsLogStore, type LogEntry } from "@/services/analytics/log-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { FileText, MousePointerClick } from "lucide-react";

export default function AnalyticsPage() {
  // We don't need state for the log as it's a direct import,
  // but we use a state to trigger re-renders if needed.
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Set initial log and maybe set up a poller if real-time updates are desired
    setLog([...analyticsLogStore].reverse());

    const interval = setInterval(() => {
      setLog([...analyticsLogStore].reverse());
    }, 1000); // Refresh every second

    return () => clearInterval(interval);
  }, []);

  return (
    <PhoneLayout>
      <Header title="Analytics Log" />
      <main className="flex-grow pt-16">
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="p-4 space-y-4">
            {log.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No analytics events have been tracked yet.</p>
                <p className="text-sm mt-2">Navigate the app to generate events.</p>
              </div>
            ) : (
              log.map((entry, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="flex-row items-center gap-4 space-y-0 p-4 bg-muted/50">
                     {entry.type === 'pageView' ? (
                       <FileText className="w-5 h-5 text-primary" />
                     ) : (
                       <MousePointerClick className="w-5 h-5 text-accent-foreground" />
                     )}
                    <div className="flex-grow">
                      <CardTitle className="text-base font-semibold">{entry.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {format(entry.timestamp, "PPP p")}
                      </p>
                    </div>
                    <Badge variant={entry.type === 'pageView' ? 'secondary' : 'outline'}>
                      {entry.type === 'pageView' ? 'Page View' : 'Event'}
                    </Badge>
                  </CardHeader>
                  {entry.properties && Object.keys(entry.properties).length > 0 && (
                    <CardContent className="p-4 text-sm">
                      <h4 className="font-medium mb-2 text-foreground">Properties</h4>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(entry.properties, null, 2)}
                      </pre>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </main>
    </PhoneLayout>
  );
}
