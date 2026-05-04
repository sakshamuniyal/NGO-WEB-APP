"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile"; // Assuming this hook is available
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/services/api"; // Assuming your API service is correctly configured
import { Donation } from "@/types";

// --- Chart Configuration for Donation Data ---
const chartConfig = {
  totalDonations: {
    label: "Total Donations",
    color: "hsl(var(--chart-1))", // You can customize this color
  },
} satisfies ChartConfig;

const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTimeRangeLabel = (range: string) => {
  switch (range) {
    case "7d":
      return "7 days";
    case "30d":
      return "30 days";
    case "90d":
      return "3 months";
    case "1y":
      return "1 year";
    case "ytd":
      return "this year";
    case "all":
      return "all time";
    default:
      return "3 months";
  }
};

// --- Chart Component ---
export function ChartAreaInteractive() {
  const isMobile = useIsMobile(); // Custom hook to detect mobile
  const [timeRange, setTimeRange] = React.useState("90d"); // Default to 3 months
  const [donations, setDonations] = React.useState<Donation[]>([]);
  const [loadingChartData, setLoadingChartData] = React.useState(true);
  const [errorChartData, setErrorChartData] = React.useState<string | null>(
    null
  );

  // Effect to adjust time range for mobile
  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  // Effect to fetch donation data (all pages) filtered by SUCCESS
  React.useEffect(() => {
    const fetchAllSuccessfulDonations = async () => {
      setLoadingChartData(true);
      setErrorChartData(null);
      try {
        const accumulated: Donation[] = [];
        // Use backend's known default page size to ensure paging progresses
        const limit = 200;
        let page = 1;
        const maxPages = 10000; // generous safety cap
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const res = await api.get("/api/admin/donations", {
            params: { status: "SUCCESS", page, limit },
          });
          const items: Donation[] = res.data || [];
          accumulated.push(...items);
          if (items.length < limit || page >= maxPages) break;
          page += 1;
        }
        setDonations(accumulated);
      } catch (err) {
        console.error("Error fetching donations for chart:", err);
        setErrorChartData("Failed to load chart data.");
      } finally {
        setLoadingChartData(false);
      }
    };
    fetchAllSuccessfulDonations();
  }, []); // Empty dependency array means this runs once on mount

  // --- Data Processing and Filtering ---
  const processedChartData = React.useMemo(() => {
    const aggregatedData: { [key: string]: number } = {};

    for (const donation of donations) {
      const amount = Number(donation.amount);
      if (!Number.isFinite(amount)) continue;
      const date = new Date(donation.timeOfPayment);
      if (Number.isNaN(date.getTime())) continue;
      const formattedDate = formatLocalDateKey(date);
      aggregatedData[formattedDate] =
        (aggregatedData[formattedDate] || 0) + amount;
    }

    // Convert aggregated data to an array of objects
    const chartDataArray = Object.keys(aggregatedData)
      .map((date) => ({
        date,
        totalDonations: aggregatedData[date],
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

    // Apply time range filter
    const referenceDate = new Date(); // Use current date as reference
    const startDate = new Date(referenceDate);
    startDate.setHours(0, 0, 0, 0); // Set to start of the day

    if (timeRange === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === "90d") {
      startDate.setDate(startDate.getDate() - 90);
    } else if (timeRange === "1y") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (timeRange === "ytd") {
      startDate.setMonth(0, 1);
    } else if (timeRange === "all") {
      return chartDataArray;
    }

    return chartDataArray.filter((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0); // Ensure comparison is only by date
      return itemDate >= startDate;
    });
  }, [donations, timeRange]);

  if (loadingChartData) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Total Donations </CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[250px]">
          <p>Loading donations data for chart...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorChartData) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Total Donations</CardTitle>
          <CardDescription>Error loading chart data.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[250px] text-red-500">
          <p>{errorChartData}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Total Donations </CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            {timeRange === "all"
              ? "Total for all time"
              : `Total for the last ${getTimeRangeLabel(timeRange)}`}
          </span>
          <span className="@[540px]/card:hidden">
            {timeRange === "all" ? "All time" : `Last ${getTimeRangeLabel(timeRange)}`}
          </span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value);
            }}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="all" className="h-8 px-2.5">
              All time
            </ToggleGroupItem>
            <ToggleGroupItem value="ytd" className="h-8 px-2.5">
              This year
            </ToggleGroupItem>
            <ToggleGroupItem value="1y" className="h-8 px-2.5">
              Last 1 year
            </ToggleGroupItem>
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All time
              </SelectItem>
              <SelectItem value="ytd" className="rounded-lg">
                This year
              </SelectItem>
              <SelectItem value="1y" className="rounded-lg">
                Last 1 year
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {processedChartData.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              No successful donation data available for this period.
            </div>
          ) : (
            <AreaChart data={processedChartData}>
              <defs>
                <linearGradient
                  id="fillTotalDonations"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-totalDonations)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-totalDonations)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string | number | Date) => {
                  const date = value instanceof Date ? value : new Date(value);
                  if (Number.isNaN(date.getTime())) return String(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: unknown) => {
                      const date =
                        value instanceof Date
                          ? value
                          : typeof value === "string" || typeof value === "number"
                            ? new Date(value)
                            : null;
                      if (!date || Number.isNaN(date.getTime())) return "";
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="totalDonations"
                type="natural"
                fill="url(#fillTotalDonations)"
                stroke="var(--color-totalDonations)"
                stackId="a" // Use a stackId if you want to stack multiple Area charts
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
