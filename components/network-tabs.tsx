"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

export function NetworkTabs() {
  return (
    <TooltipProvider>
      <Tabs defaultValue="testnet">
        <TabsList className="h-9 bg-gray-100 p-1">
          <TabsTrigger
            value="testnet"
            className="h-7 px-3 text-xs font-medium data-[selected]:bg-white data-[selected]:text-green-700 data-[selected]:shadow-sm data-[selected]:ring-1 data-[selected]:ring-green-500/40"
          >
            Arc Testnet
          </TabsTrigger>

          {/* Visual separator between tabs */}
          <div className="w-px h-4 bg-gray-300 self-center mx-0.5 shrink-0" />

          <Tooltip>
            {/* span wrapper so tooltip fires on hover despite disabled button */}
            <TooltipTrigger render={<span className="inline-flex items-center" tabIndex={-1} />}>
              <TabsTrigger
                value="mainnet"
                disabled
                className="pointer-events-none h-7 px-3 text-xs font-medium opacity-40 gap-1.5"
              >
                Arc Mainnet
                <span className="rounded-full bg-gray-400/30 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 leading-none">
                  Soon
                </span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Arc Mainnet coming soon</TooltipContent>
          </Tooltip>
        </TabsList>
      </Tabs>
    </TooltipProvider>
  )
}
