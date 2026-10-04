import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Eye, GalleryVerticalEnd, AlertTriangle, Users, Shield,
  Heart, Star, MessageSquare, LogIn, ShoppingCart, TrendingUp, History,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardCard, ChartCard } from '@/components/ui/DashboardCard';
import api from '@/lib/api';
import { GridSkeleton } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/EmptyState';

const COLORS = ['#8b7355', '#a8a29e', '#d4a574', '#78716c', '#b45309', '#92400e', '#c2410c', '#1c1917'];
const RATING_COLORS = ['#16a34a', '#84cc16', '#eab308', '#f97316', '#dc2626'];

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{children}</h2>
      <div className="flex-1 h-px bg-stone-200" />
    </div>
  );
}

interface DashboardStats {
  total: number;
  public: number;
  onExhibition: number;
  needConservation: number;
  exhibitions: number;
  visitors: number;
  curators: number;
  totalUsers: number;
  newUsersThisMonth: number;
  loginsThisWeek: number;
  totalReviews: number;
  pendingReviews: number;
  totalComments: number;
  pendingComments: number;
  totalCategoryLikes: number;
  totalFavorites: number;
  activeCarts: number;
  totalCartItems: number;
  averageRating: number;
  reviewsThisMonth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, public: 0, onExhibition: 0, needConservation: 0, exhibitions: 0,
    visitors: 0, curators: 0, totalUsers: 0, newUsersThisMonth: 0, loginsThisWeek: 0,
    totalReviews: 0, pendingReviews: 0, totalComments: 0, pendingComments: 0,
    totalCategoryLikes: 0, totalFavorites: 0, activeCarts: 0, totalCartItems: 0,
    averageRating: 0, reviewsThisMonth: 0,
  });
  const [byCategory, setByCategory] = useState<{ name: string; count: number }[]>([]);
  const [byPeriod, setByPeriod] = useState<{ name: string; count: number }[]>([]);
  const [byCondition, setByCondition] = useState<{ name: string; count: number }[]>([]);
  const [acquisitionTrends, setAcquisitionTrends] = useState<{ year: string; count: number }[]>([]);
  const [exhibitionStats, setExhibitionStats] = useState<{ name: string; value: number }[]>([]);
  const [recentArtifacts, setRecentArtifacts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ date: string; users: number }[]>([]);
  const [categoryLikesData, setCategoryLikesData] = useState<{ name: string; likes: number }[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<{ name: string; count: number }[]>([]);
  const [mostReviewed, setMostReviewed] = useState<{ name: string; count: number }[]>([]);
  const [highestRated, setHighestRated] = useState<{ name: string; rating: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/curator/admin-dashboard-stats');
        if (data.stats) setStats(data.stats);
        if (data.byCategory) setByCategory(data.byCategory);
        if (data.byPeriod) setByPeriod(data.byPeriod);
        if (data.byCondition) setByCondition(data.byCondition);
        if (data.acquisitionTrends) setAcquisitionTrends(data.acquisitionTrends);
        if (data.exhibitionStats) setExhibitionStats(data.exhibitionStats);
        if (data.recentArtifacts) setRecentArtifacts(data.recentArtifacts);
        if (data.recentActivity) setRecentActivity(data.recentActivity);
        if (data.recentReviews) setRecentReviews(data.recentReviews);
        if (data.recentComments) setRecentComments(data.recentComments);
        if (data.userGrowth) setUserGrowth(data.userGrowth);
        if (data.categoryLikesData) setCategoryLikesData(data.categoryLikesData);
        if (data.ratingDistribution) setRatingDistribution(data.ratingDistribution);
        if (data.mostReviewed) setMostReviewed(data.mostReviewed);
        if (data.highestRated) setHighestRated(data.highestRated);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <DashboardLayout title="Dashboard"><GridSkeleton count={4} /></DashboardLayout>;
  if (error) return <DashboardLayout title="Dashboard"><ErrorState message="Failed to load dashboard data. Please try again." /></DashboardLayout>;

  return (
    <DashboardLayout title="Dashboard">
      <div className="animate-fade-in">
        {/* Collection Stats */}
        <SectionHeader>Collection Overview</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
          <DashboardCard label="Total Artifacts" value={stats.total} icon={Package} color="stone" />
          <DashboardCard label="Public" value={stats.public} icon={Eye} color="blue" />
          <DashboardCard label="On Exhibition" value={stats.onExhibition} icon={GalleryVerticalEnd} color="amber" />
          <DashboardCard label="Need Conservation" value={stats.needConservation} icon={AlertTriangle} color="red" />
          <DashboardCard label="Exhibitions" value={stats.exhibitions} icon={GalleryVerticalEnd} color="purple" />
          <DashboardCard label="Visitors" value={stats.visitors} icon={Users} color="green" />
          <DashboardCard label="Curators" value={stats.curators} icon={Shield} color="stone" />
        </div>

        {/* User Engagement Stats */}
        <SectionHeader>User Engagement</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
          <DashboardCard label="Total Users" value={stats.totalUsers} icon={Users} color="blue" subtitle={`${stats.newUsersThisMonth} new this month`} />
          <DashboardCard label="Logins (7 days)" value={stats.loginsThisWeek} icon={LogIn} color="green" />
          <DashboardCard label="Total Favorites" value={stats.totalFavorites} icon={Heart} color="red" />
          <DashboardCard label="Category Likes" value={stats.totalCategoryLikes} icon={TrendingUp} color="amber" />
          <DashboardCard label="Reviews" value={stats.totalReviews} icon={Star} color="purple" subtitle={`${stats.pendingReviews} pending`} />
          <DashboardCard label="Comments" value={stats.totalComments} icon={MessageSquare} color="stone" subtitle={`${stats.pendingComments} pending`} />
        </div>

        {/* Cart Stats */}
        <SectionHeader>Cart Activity</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard label="Active Carts" value={stats.activeCarts} icon={ShoppingCart} color="blue" />
          <DashboardCard label="Cart Items" value={stats.totalCartItems} icon={Package} color="amber" />
          <DashboardCard label="Pending Reviews" value={stats.pendingReviews} icon={Star} color="red" subtitle="Awaiting approval" />
          <DashboardCard label="Pending Comments" value={stats.pendingComments} icon={MessageSquare} color="stone" subtitle="Awaiting approval" />
        </div>

        {/* Review Insights */}
        <SectionHeader>Review Insights</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard label="Total Reviews" value={stats.totalReviews} icon={MessageSquare} color="purple" subtitle={`${stats.pendingReviews} pending approval`} />
          <DashboardCard label="Average Rating" value={stats.averageRating > 0 ? `${stats.averageRating} / 5` : '—'} icon={Star} color="amber" subtitle="Across all published reviews" />
          <DashboardCard label="Reviews This Month" value={stats.reviewsThisMonth} icon={TrendingUp} color="green" subtitle="Last 30 days" />
          <DashboardCard label="Pending Reviews" value={stats.pendingReviews} icon={AlertTriangle} color="red" subtitle="Awaiting moderation" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Artifacts by Category" subtitle="Distribution across collection categories">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Bar dataKey="count" fill="#8b7355" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Artifacts by Historical Period" subtitle="Distribution across time periods">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Bar dataKey="count" fill="#b45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Artifact Condition Distribution" subtitle="Current condition of all artifacts">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byCondition} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry: any) => `${entry.name}: ${entry.value}`}>
                  {byCondition.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Acquisition Trends" subtitle="Acquisitions by year">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={acquisitionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Line type="monotone" dataKey="count" stroke="#8b7355" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Engagement Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="User Growth" subtitle="Cumulative registered users over 6 months">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Category Popularity" subtitle="Most liked categories by visitors">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryLikesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Bar dataKey="likes" fill="#d4a574" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Rating Distribution + Exhibition Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Review Ratings" subtitle="Distribution of artifact ratings">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ratingDistribution.map((_, i) => <Cell key={i} fill={RATING_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Exhibition Statistics" subtitle="Status of all exhibitions">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={exhibitionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Bar dataKey="value" fill="#d4a574" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Most Reviewed + Highest Rated Artifacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Most Reviewed Artifacts" subtitle="Top 10 by review count">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mostReviewed} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Bar dataKey="count" fill="#8b7355" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Highest Rated Artifacts" subtitle="Top 10 by average rating">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={highestRated} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
                <Bar dataKey="rating" fill="#d4a574" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent Activity: Reviews + Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-stone-800 flex items-center gap-2"><Star size={18} className="text-amber-500" /> Recent Reviews</h3>
              <Link to="/admin/reviews" className="text-xs text-amber-700 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {recentReviews.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No reviews yet.</p>
              ) : recentReviews.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-700 truncate">{r.artifact?.name ?? 'Unknown'}</span>
                      {r.status !== 'published' && <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">{r.status}</span>}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">{r.title} — {r.body}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{r.user?.full_name ?? 'Unknown'} • {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-stone-800 flex items-center gap-2"><MessageSquare size={18} className="text-blue-500" /> Recent Comments</h3>
              <Link to="/admin/audit-logs" className="text-xs text-amber-700 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {recentComments.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">No comments yet.</p>
              ) : recentComments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-700 truncate">{c.artifact?.name ?? 'Unknown'}</span>
                      {c.status !== 'published' && <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">{c.status}</span>}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{c.body}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{c.user?.full_name ?? 'Unknown'} • {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Artifacts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2"><Package size={18} className="text-stone-500" /> Recent Artifacts</h3>
            <div className="space-y-3">
              {recentArtifacts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-stone-700">{a.name}</p>
                    <p className="text-xs text-stone-400">{a.accession_number}</p>
                  </div>
                  <span className="text-xs text-stone-400">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2"><History size={18} className="text-stone-500" /> Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-stone-700">{log.action}</p>
                    <p className="text-xs text-stone-400">{log.user?.full_name ?? 'System'} — {log.description}</p>
                  </div>
                  <span className="text-xs text-stone-400">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}