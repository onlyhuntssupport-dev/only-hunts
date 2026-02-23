'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardData } from '@/lib/data';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Calendar } from '@/components/ui/calendar';
import { Eye, Mail, Check, DollarSign } from 'lucide-react';

const iconMap = {
    'Total Inquiries': Mail,
    'Pending Responses': Eye,
    'Confirmed Bookings (Year)': Check,
    'Profile Views (Month)': DollarSign,
}

const chartConfig = {
  inquiries: {
    label: "Inquiries",
    color: "hsl(var(--primary))",
  },
} satisfies import('@/components/ui/chart').ChartConfig;

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <header>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Outfitter Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your activity.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dashboardData.stats.map(stat => {
                const Icon = iconMap[stat.label as keyof typeof iconMap] || DollarSign;
                return (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Inquiries Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={dashboardData.inquiriesChart}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="inquiries" fill="var(--color-inquiries)" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Availability Calendar</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={[new Date()]}
                        className="rounded-md border"
                    />
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Recent Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hunter</TableHead>
                            <TableHead>Hunt Package</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dashboardData.recentInquiries.map(inquiry => (
                            <TableRow key={inquiry.id}>
                                <TableCell className="font-medium">{inquiry.hunterName}</TableCell>
                                <TableCell>{inquiry.hunt}</TableCell>
                                <TableCell>{inquiry.date}</TableCell>
                                <TableCell>
                                    <Badge variant={inquiry.status === 'Pending' ? 'destructive' : 'secondary'}>
                                        {inquiry.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">View</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
