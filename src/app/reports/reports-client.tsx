
'use client';

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
  ResponsiveContainer,
} from "recharts";
import { Euro, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ReportsData } from "./actions";

type ReportsClientProps = {
  data: ReportsData;
}

export function ReportsClient({ data }: ReportsClientProps) {
    const { 
      totalRevenue, 
      totalExpenses, 
      netProfit, 
      profitMargin, 
      financialData, 
      transactions 
    } = data;

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })}</div>
                        <p className="text-xs text-muted-foreground">Depuis le début de l'année</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dépenses totales</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalExpenses.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })}</div>
                        <p className="text-xs text-muted-foreground">Depuis le début de l'année</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bénéfice net</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{netProfit.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })}</div>
                        <p className="text-xs text-muted-foreground">Depuis le début de l'année</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Marge bénéficiaire</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Depuis le début de l'année</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Revenus vs. Dépenses</CardTitle>
                <CardDescription>
                Un résumé de votre performance financière au cours des 6 derniers mois.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full p-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ChartContainer config={{
                    income: { label: "Revenus", color: "hsl(var(--chart-2))" },
                    expenses: { label: "Dépenses", color: "hsl(var(--chart-1))" },
                  }} className="h-full w-full">
                      <AreaChart data={financialData}>
                      <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tickLine={false} axisLine={false}/>
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k €`} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area type="monotone" dataKey="income" name="Revenus" stroke="var(--color-income)" fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="var(--color-expenses)" fillOpacity={1} fill="url(#colorExpenses)" />
                      </AreaChart>
                  </ChartContainer>
                </ResponsiveContainer>
            </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Transactions récentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell className="font-medium">{tx.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.type === 'Revenu' ? 'default' : 'secondary'} className={tx.type === 'Revenu' ? 'bg-green-500/20 text-green-700 border-green-500/20' : 'bg-red-500/20 text-red-700 border-red-500/20'}>{tx.type}</Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${tx.type === 'Revenu' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'Dépense' ? '-' : ''}{tx.amount.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' })}
                                    </TableCell>
                                </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">Aucune transaction</TableCell>
                              </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
