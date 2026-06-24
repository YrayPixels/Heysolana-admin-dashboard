import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppCampaign } from "@/services/api";

export const WhatsAppStatsCards = ({ campaign }: { campaign: WhatsAppCampaign }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Queued</CardDescription>
        <CardTitle>{campaign.stats?.sent ?? campaign.recipient_count ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Delivered</CardDescription>
        <CardTitle>{campaign.stats?.delivered ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Link clicks</CardDescription>
        <CardTitle>{campaign.stats?.link_clicks ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>CTR</CardDescription>
        <CardTitle>{campaign.stats?.ctr_rate ?? 0}%</CardTitle>
      </CardHeader>
    </Card>
  </div>
);
