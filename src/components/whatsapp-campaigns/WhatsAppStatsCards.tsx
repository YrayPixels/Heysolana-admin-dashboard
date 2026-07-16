import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppCampaign } from "@/services/api";

export const WhatsAppStatsCards = ({ campaign }: { campaign: WhatsAppCampaign }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Pending</CardDescription>
        <CardTitle>{campaign.stats?.queued ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Sent</CardDescription>
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
        <CardDescription>Replies</CardDescription>
        <CardTitle>{campaign.stats?.replies ?? 0}</CardTitle>
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
