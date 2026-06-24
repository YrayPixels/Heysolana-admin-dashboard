import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PushCampaign } from "@/services/api";

export const PushStatsCards = ({ campaign }: { campaign: PushCampaign }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Sent (devices)</CardDescription>
        <CardTitle>{campaign.stats?.sent ?? campaign.device_count ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Opened</CardDescription>
        <CardTitle>{campaign.stats?.opened ?? 0}</CardTitle>
      </CardHeader>
    </Card>
    <Card className="glass-morphism border-white/10">
      <CardHeader className="pb-2">
        <CardDescription>Unique openers</CardDescription>
        <CardTitle>{campaign.stats?.unique_openers ?? 0}</CardTitle>
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
