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
        <TabsList className="h-8 bg-gray-100 p-0.5">
          <TabsTrigger
            value="testnet"
            className="h-7 px-3 text-xs font-medium data-[selected]:bg-white data-[selected]:text-green-700 data-[selected]:shadow-sm"
          >
            Arc Testnet
          </TabsTrigger>
          <Tooltip>
            {/* Wrap disabled tab in a span so hover events fire despite pointer-events-none on the button */}
            <TooltipTrigger render={<span className="inline-flex" tabIndex={-1} />}>
              <TabsTrigger
                value="mainnet"
                disabled
                className="pointer-events-none h-7 px-3 text-xs font-medium"
              >
                Arc Mainnet
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Arc mainnet coming soon</TooltipContent>
          </Tooltip>
        </TabsList>
      </Tabs>
    </TooltipProvider>
  )
}
