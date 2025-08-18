import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, DollarSign, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const financialData = [
  { month: "Jan", income: 4000, expenses: 2400 },
  { month: "Feb", income: 3000, expenses: 1398 },
  { month: "Mar", income: 5000, expenses: 3800 },
  { month: "Apr", income: 4500, expenses: 2908 },
  { month: "May", income: 6000, expenses: 4800 },
  { month: "Jun", income: 5500, expenses: 3800 },
];

const transactions = [
    {id: 1, date: "2024-07-25", description: "Plumbing Repair - Apt 101", type: "Expense", amount: 250},
    {id: 2, date: "2024-07-20", description: "Rent - Jane Smith", type: "Income", amount: 1500},
    {id: 3, date: "2024-07-18", description: "Landscaping Services", type: "Expense", amount: 300},
    {id: 4, date: "2024-07-15", description: "Rent - John Doe", type: "Income", amount: 1200},
    {id: 5, date: "2024-07-10", description: "Property Insurance", type: "Expense", amount: 450},
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Financial Reports">
        <Button size="sm" variant="outline" className="gap-1">
          <Download className="h-3.5 w-3.5" />
          Download Reports
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$125,430.50</div>
                    <p className="text-xs text-muted-foreground">Year to date</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$60,120.90</div>
                    <p className="text-xs text-muted-foreground">Year to date</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$65,309.60</div>
                    <p className="text-xs text-muted-foreground">Year to date</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">52.1%</div>
                    <p className="text-xs text-muted-foreground">Year to date</p>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Income vs. Expenses</CardTitle>
            <CardDescription>
              A summary of your financial performance over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[350px] w-full">
              <ResponsiveContainer>
                <AreaChart data={financialData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false}/>
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Legend />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell className="font-medium">{tx.description}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.type === 'Income' ? 'default' : 'secondary'} className={tx.type === 'Income' ? 'bg-green-500/20 text-green-700 border-green-500/20' : 'bg-red-500/20 text-red-700 border-red-500/20'}>{tx.type}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${tx.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'Expense' ? '-' : ''}${tx.amount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
