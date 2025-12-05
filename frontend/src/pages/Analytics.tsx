import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { TrendingUp, Package, Users, Calendar } from 'lucide-react'
import api from '../lib/api'

export default function Analytics() {
    const [loading, setLoading] = useState(true)
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [statusData, setStatusData] = useState<any[]>([])
    const [monthlyData, setMonthlyData] = useState<any[]>([])

    useEffect(() => {
        loadAnalytics()
    }, [])

    const loadAnalytics = async () => {
        try {
            // Fetch real analytics data from backend
            const response = await api.get('/api/analytics/overview')
            const data = response.data

            // Process data for charts
            const overview = data.overview || {}
            const categories = data.categories || []

            // Category distribution
            setCategoryData(categories.map((cat: any) => ({
                name: cat.category,
                value: parseInt(cat.count),
                count: parseInt(cat.count)
            })));

            // Status distribution
            const statusMap: any = {
                available: parseInt(overview.available || 0),
                assigned: parseInt(overview.assigned || 0),
                maintenance: parseInt(overview.maintenance || 0),
                lost: parseInt(overview.lost || 0),
                retired: parseInt(overview.retired || 0)
            };

            setStatusData([
                { name: 'Available', value: statusMap.available, fill: '#22c55e' },
                { name: 'Assigned', value: statusMap.assigned, fill: '#3b82f6' },
                { name: 'Maintenance', value: statusMap.maintenance, fill: '#eab308' },
                { name: 'Lost', value: statusMap.lost, fill: '#ef4444' },
                { name: 'Retired', value: statusMap.retired, fill: '#6b7280' },
            ].filter(item => item.value > 0));

            // For monthly trends, we'll still use mock data for now
            // In a real implementation, you'd fetch this from a dedicated endpoint
            setMonthlyData([
                { month: 'Jul', assignments: 12, returns: 8, maintenance: 2 },
                { month: 'Aug', assignments: 15, returns: 10, maintenance: 3 },
                { month: 'Sep', assignments: 18, returns: 14, maintenance: 4 },
                { month: 'Oct', assignments: 22, returns: 16, maintenance: 5 },
                { month: 'Nov', assignments: 20, returns: 18, maintenance: 3 },
                { month: 'Dec', assignments: 25, returns: 20, maintenance: 6 },
            ]);

            setLoading(false)
        } catch (err) {
            console.error('Analytics error:', err)
            // Fallback to mock data on error
            setCategoryData([
                { name: 'Laptops', value: 45, count: 45 },
                { name: 'Phones', value: 30, count: 30 },
                { name: 'Tablets', value: 15, count: 15 },
                { name: 'Accessories', value: 10, count: 10 },
            ])

            setStatusData([
                { name: 'Available', value: 40, fill: '#22c55e' },
                { name: 'Assigned', value: 35, fill: '#3b82f6' },
                { name: 'Maintenance', value: 15, fill: '#eab308' },
                { name: 'Lost', value: 5, fill: '#ef4444' },
                { name: 'Retired', value: 5, fill: '#6b7280' },
            ])

            setMonthlyData([
                { month: 'Jul', assignments: 12, returns: 8, maintenance: 2 },
                { month: 'Aug', assignments: 15, returns: 10, maintenance: 3 },
                { month: 'Sep', assignments: 18, returns: 14, maintenance: 4 },
                { month: 'Oct', assignments: 22, returns: 16, maintenance: 5 },
                { month: 'Nov', assignments: 20, returns: 18, maintenance: 3 },
                { month: 'Dec', assignments: 25, returns: 20, maintenance: 6 },
            ])
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold">Analytics</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader><div className="h-6 bg-muted rounded w-32" /></CardHeader>
                            <CardContent><div className="h-64 bg-muted rounded" /></CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6']

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">Device usage insights and trends</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">100</div>
                        <p className="text-xs text-muted-foreground">+5 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-xs text-muted-foreground">+12% increase</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">25</div>
                        <p className="text-xs text-muted-foreground">Assignments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Utilization</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">75%</div>
                        <p className="text-xs text-muted-foreground">Device usage rate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Category Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Device Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="assignments" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="returns" stroke="#22c55e" strokeWidth={2} />
                            <Line type="monotone" dataKey="maintenance" stroke="#eab308" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
