import { useState, useEffect } from "react";
// import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"; // Keep both icons for potential future use

// import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { api } from "@/services/api"; // Import your API service
import { Donation } from "@/types";

export function SectionCards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalDonationsCount: 0,
    uniqueDonors: 0,
    averageDonationValue: 0,
  });

  useEffect(() => {
    const fetchAllMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        let page = 1;
        const limit = 200; // fetch in larger chunks for performance
        const maxPages = 10000; // safety cap

        let totalRevenue = 0;
        let totalDonationsCount = 0;
        const uniqueDonorIds = new Set<string>();

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const res = await api.get("/api/admin/donations", {
            params: { status: "SUCCESS", page, limit },
          });
          const items: Donation[] = res.data || [];

          if (items.length === 0) break;

          for (const donation of items) {
            const amountNum = Number(donation.amount) || 0;
            totalRevenue += amountNum;
            totalDonationsCount += 1;
            if (!donation.isAnonymous && donation.user?.id) {
              uniqueDonorIds.add(donation.user.id);
            }
          }

          if (items.length < limit || page >= maxPages) break;
          page += 1;
        }

        const calculatedUniqueDonors = uniqueDonorIds.size;
        const calculatedAverageDonationValue =
          totalDonationsCount > 0 ? totalRevenue / totalDonationsCount : 0;

        setMetrics({
          totalRevenue,
          totalDonationsCount,
          uniqueDonors: calculatedUniqueDonors,
          averageDonationValue: calculatedAverageDonationValue,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data for SectionCards:", err);
        setError("Failed to load dashboard metrics.");
        setLoading(false);
      }
    };

    fetchAllMetrics();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Loading...</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              ₹__.__
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Fetching latest data...
          </CardFooter>
        </Card>
        {/* You can duplicate loading cards or loop a placeholder for better UX */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Loading...</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              __.__
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Fetching latest data...
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Loading...</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              __.__
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Fetching latest data...
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Loading...</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              ₹__.__
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Fetching latest data...
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error}
        <p>Please ensure the backend is running and the admin is logged in.</p>
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Donation Revenue</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            ₹{metrics.totalRevenue.toFixed(2)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            {/* <Badge variant="outline" className="flex gap-1 rounded-lg text-xs"> */}
            {/* <TrendingUpIcon className="size-3" />
              N/A{" "} */}
            {/* Simplified percentage, as real trend needs more complex logic */}
            {/* </Badge> */}
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Accumulated successful donations
          </div>
          <div className="text-muted-foreground">
            Overall sum of successful donations
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Donations Made</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {metrics.totalDonationsCount.toLocaleString()}
          </CardTitle>
          <div className="absolute right-4 top-4">
            {/* <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              N/A {/* Simplified percentage */}
            {/* </Badge> */}
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Count of all successful transactions
          </div>
          <div className="text-muted-foreground">
            Number of individual successful donations
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Unique Donors</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {metrics.uniqueDonors.toLocaleString()}
          </CardTitle>
          <div className="absolute right-4 top-4">
            {/* <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              N/A {/* Simplified percentage */}
            {/* </Badge> */}
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Unique individuals who donated
          </div>
          <div className="text-muted-foreground">
            Excludes anonymous and guest donations
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Average Donation Value</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            ₹{metrics.averageDonationValue.toFixed(2)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            {/* <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              N/A {/* Simplified percentage */}
            {/* </Badge> */}
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Average amount per successful donation
          </div>
          <div className="text-muted-foreground">
            Mean value of successful contributions
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
