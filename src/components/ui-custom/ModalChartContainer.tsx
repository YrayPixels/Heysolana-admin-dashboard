import React from "react";
import { cn } from "@/lib/utils";

/** Recharts ResponsiveContainer needs a parent with a real pixel height. */
const ModalChartContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}> = ({ children, className, scrollable }) => (
  <div
    className={cn(
      "w-full h-[min(72vh,720px)] min-h-[25rem]",
      scrollable && "overflow-y-auto",
      className
    )}
  >
    <div className="w-full h-full min-h-[25rem]">{children}</div>
  </div>
);

export default ModalChartContainer;
