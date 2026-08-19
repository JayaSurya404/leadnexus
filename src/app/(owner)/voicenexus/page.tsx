import type { Metadata } from "next";
import { PhoneCall, Send, AlertTriangle } from "lucide-react";

import { requireOwner } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";
import { queueVoiceNexusLeadAction } from "@/actions/integrations/queue-voicenexus-lead";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "VoiceNexus | LeadNexus",
};

export default async function VoiceNexusPage() {
  const context = await requireOwner();
  const supabase = await createClient();

  const [leadsResult, productsResult, eventsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, phone, status, do_not_call, primary_product_id")
      .eq("business_id", context.business.id)
      .eq("visibility", "OWNER_VISIBLE")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),

    supabase
      .from("products")
      .select("id, name")
      .eq("business_id", context.business.id),

    supabase
      .from("outbox_events")
      .select("aggregate_id, status, created_at")
      .eq("business_id", context.business.id)
      .eq("provider", "VOICENEXUS")
      .eq("event_type", "LEAD_HANDOFF_REQUESTED")
      .order("created_at", { ascending: false })
  ]);

  const leads = leadsResult.data ?? [];
  const products = productsResult.data ?? [];
  const events = eventsResult.data ?? [];

  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const eventStatusMap = new Map<string, string>();
  for (const event of events) {
    if (event.aggregate_id && !eventStatusMap.has(event.aggregate_id)) {
      eventStatusMap.set(event.aggregate_id, event.status);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <PhoneCall className="size-4" />
            Integrations
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            VoiceNexus Handoff
          </h1>

          <p className="mt-2 text-muted-foreground">
            Send your leads to VoiceNexus for automated calling.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Leads</CardTitle>
          <CardDescription>
            Leads that can be sent to VoiceNexus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 text-left font-medium">Name</th>
                  <th className="h-10 px-4 text-left font-medium">Phone</th>
                  <th className="h-10 px-4 text-left font-medium">Status</th>
                  <th className="h-10 px-4 text-left font-medium">Interest</th>
                  <th className="h-10 px-4 text-left font-medium">Handoff Status</th>
                  <th className="h-10 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const eventStatus = eventStatusMap.get(lead.id);
                    const dnc = Boolean(lead.do_not_call);
                    const queueLead = queueVoiceNexusLeadAction.bind(null, lead.id);

                    return (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4 font-medium">{lead.name}</td>
                        <td className="p-4">{lead.phone}</td>
                        <td className="p-4">
                          <Badge variant="outline">{lead.status}</Badge>
                        </td>
                        <td className="p-4">
                          {lead.primary_product_id ? productMap.get(lead.primary_product_id) ?? "Unknown" : "-"}
                        </td>
                        <td className="p-4">
                          {dnc ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="size-3" />
                              DNC
                            </Badge>
                          ) : eventStatus ? (
                            <Badge variant="secondary">{eventStatus}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <form action={queueLead}>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={dnc || eventStatus === "PENDING" || eventStatus === "PROCESSING"}
                            >
                              <Send className="mr-2 size-3" />
                              Send
                            </Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
