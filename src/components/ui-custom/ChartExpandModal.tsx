import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ModalChartContainer from "@/components/ui-custom/ModalChartContainer";
import { cn } from "@/lib/utils";

export type ExpandedChartConfig = {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  scrollable?: boolean;
  render: () => React.ReactNode;
} | null;

type ChartExpandModalProps = {
  chart: ExpandedChartConfig;
  onClose: () => void;
};

const ChartExpandModal: React.FC<ChartExpandModalProps> = ({
  chart,
  onClose,
}) => (
  <Dialog open={chart !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      className={cn(
        "!flex !flex-col max-w-[min(96vw,72rem)] w-full max-h-[92vh] overflow-hidden p-0 gap-0",
        "bg-zinc-950/98 border-white/10 text-white sm:rounded-xl"
      )}
    >
      {chart ? (
        <>
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 space-y-1">
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              {chart.icon}
              {chart.title}
            </DialogTitle>
            {chart.subtitle ? (
              <DialogDescription className="text-gray-400 text-left">
                {chart.subtitle}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="px-6 pb-6 shrink-0">
            <ModalChartContainer scrollable={chart.scrollable}>
              {chart.render()}
            </ModalChartContainer>
          </div>
        </>
      ) : null}
    </DialogContent>
  </Dialog>
);

export default ChartExpandModal;
