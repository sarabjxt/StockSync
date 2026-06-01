import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import {
  CircleAlert,
  IndianRupee,
  RefreshCcw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"
import type { ChartConfig } from "@/components/ui/chart"
import { trpc } from "@/lib/trpc"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn, formatMoney } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_protected/_sidebar/dashboard")({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = Route.useRouteContext()

  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-heading font-medium">
          Hi, {user.name.slice(0, user.name.lastIndexOf(" "))}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your store's performance today.
        </p>
      </div>
      <div className="py-4 md:py-6">
        <MainCards />
      </div>
    </div>
  )
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const categoryChartConfig = {
  totalAmount: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

function MainCards() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery(trpc.analytics.getDashboardStats.queryOptions())

  const [chartDays, setChartDays] = useState("7")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner />
      </div>
    )
  }
  if (error || !stats) {
    return (
      <Empty className="border border-dashed md:py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle className="text-base">
            {error?.message || "Something went wrong!"}
          </EmptyTitle>
          <EmptyDescription>
            Unable to fetch dashboard stats. Please try again later.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCcw className={cn(isRefetching && "animate-spin")} />
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Main Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {formatMoney(stats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total revenue from sales today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today's Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                stats.todayProfit > 0 ? "text-success" : "text-muted-foreground"
              )}
            >
              {formatMoney(stats.todayProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net profit after cost of goods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.todaySalesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Number of sales today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Outstanding Udhar</CardTitle>
            <Users
              className={cn(
                "h-4 w-4",
                stats.totalDebt > 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                stats.totalDebt > 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {formatMoney(stats.totalDebt || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total money owed by customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              Total for the last {chartDays} days
            </span>
            <span className="@[540px]/card:hidden">Last {chartDays} days</span>
          </CardDescription>
          <CardAction>
            <ToggleGroup
              variant="outline"
              value={[chartDays]}
              onValueChange={(value) => setChartDays(value[0])}
              className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
            >
              <ToggleGroupItem value="7">Last 7 days</ToggleGroupItem>
              <ToggleGroupItem value="14">Last 14 days</ToggleGroupItem>
              <ToggleGroupItem value="30">Last 30 days</ToggleGroupItem>
            </ToggleGroup>
            <Select
              value={chartDays}
              onValueChange={(value) => value && setChartDays(value)}
            >
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 7 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="h-[300px] w-full mt-2"
          >
            <BarChart
              accessibilityLayer
              data={
                chartDays === "7"
                  ? stats.chartData7
                  : chartDays === "30"
                    ? stats.chartData30
                    : stats.chartData14
              }
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
              />
              <YAxis
                dataKey="revenue"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelClassName="w-32"
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top selling products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Based on quantity sold in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topSellingItems.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No sales yet
              </div>
            ) : (
              <ol className="list-decimal pl-4 space-y-4">
                {stats.topSellingItems.map((item) => (
                  <li key={item.name}>
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="font-medium font-heading">
                          {item.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.abs(item.totalQuantity)} sold
                        </div>
                      </div>
                      <div className="tabular-nums">
                        {formatMoney(item.totalAmount)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Top selling item categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Categories</CardTitle>
            <CardDescription>
              Based on revenue generated in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center">
            {stats.topSellingItemCategories.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No sales yet
              </div>
            ) : (
              <ChartContainer
                config={categoryChartConfig}
                className="min-h-[100px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={stats.topSellingItemCategories}
                  layout="vertical"
                  margin={{
                    right: 16,
                  }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    hide
                  />
                  <XAxis dataKey="totalAmount" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) => {
                          const quantity = Math.abs(item.payload.totalQuantity)
                          return (
                            <div className="flex flex-col gap-1 p-0.5">
                              <span className="font-medium text-foreground">
                                {item.payload.name}
                              </span>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span>
                                  Revenue:{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatMoney(Number(value))}
                                  </span>
                                </span>
                                <span>
                                  Sold:{" "}
                                  <span className="font-semibold text-foreground">
                                    {quantity} units
                                  </span>
                                </span>
                              </div>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="totalAmount"
                    fill="var(--color-chart-1)"
                    radius={4}
                  >
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      offset={8}
                      className="fill-(--color-label)"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
