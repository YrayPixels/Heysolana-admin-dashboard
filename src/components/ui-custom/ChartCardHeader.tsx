import React from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChartCardHeaderProps = {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  onExpand?: () => void;
  expandable?: boolean;
  extra?: React.ReactNode;
};

const ChartCardHeader: React.FC<ChartCardHeaderProps> = ({
  title,
  icon,
  subtitle,
  onExpand,
  expandable = true,
  extra,
}) => (
  <div className="flex items-start justify-between gap-2 mb-4">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      {subtitle ? (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      ) : null}
    </div>
    <div className="flex items-center gap-1 shrink-0">
      {extra}
      {expandable && onExpand ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
          onClick={onExpand}
          aria-label={`Expand ${title}`}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  </div>
);

export default ChartCardHeader;
