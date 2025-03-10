'use client'
import { useState } from "react";
import { HeroSection } from "@/components/blocks/hero-section-dark";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Check, Sparkles, Brain, Network, FileSearch, ChartBar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";


const FEATURES = [
  {
    title: "AI-Powered Profile Optimization",
    description: "Get personalized recommendations to enhance your profile visibility",
    icon: Brain,
  },
  {
    title: "Network Analytics",
    description: "Understand your connection patterns and growth opportunities",
    icon: Network,
  },
  {
    title: "CV-LinkedIn Alignment",
    description: "Ensure consistency between your CV and LinkedIn profile",
    icon: FileSearch,
  },
  {
    title: "Engagement Insights",
    description: "Track and improve your content performance",
    icon: ChartBar,
  },
]

const PRICING_TIERS = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    features: [
      "2 free Profile analysis",
      "Limited recommendations",
      "Connection visualization",
      "Standard support",
      "Predefined prompts"
    ],
  },
  {
    name: "Pro",
    price: "2",
    description: "For serious networkers",
    features: [
      "Unlimited profile analysis",
      "Network growth insights",
      "Priority support",
      "Custom export options",
      "CV-LinkedIn alignment",
      "Custom prompts",
    ],
    highlighted: true,
  },
]

const INDUSTRY_DATA = [
  { name: 'Technology', value: 400, color: '#8884d8' },
  { name: 'Finance', value: 300, color: '#82ca9d' },
  { name: 'Healthcare', value: 200, color: '#ffc658' },
  { name: 'Education', value: 150, color: '#ff8042' },
  { name: 'Manufacturing', value: 100, color: '#0088fe' }
];

const ROLE_DATA = [
  { name: 'Software Engineer', count: 250, color: '#8884d8' },
  { name: 'Product Manager', count: 180, color: '#82ca9d' },
  { name: 'Data Scientist', count: 150, color: '#ffc658' },
  { name: 'Designer', count: 120, color: '#ff8042' },
  { name: 'Marketing', count: 100, color: '#0088fe' }
];

const SENIORITY_DATA = [
  { name: 'Senior', value: 300, color: '#8884d8' },
  { name: 'Mid-Level', value: 400, color: '#82ca9d' },
  { name: 'Junior', value: 200, color: '#ffc658' },
  { name: 'Executive', value: 100, color: '#ff8042' }
];

const CHARTS = [
  {
    title: "Industry Distribution",
    description: "Where do your connections work?",
    component: "PieChart",
    data: INDUSTRY_DATA,
  },
  {
    title: "Top Roles",
    description: "Most common roles in your network",
    component: "BarChart",
    data: ROLE_DATA,
  },
  {
    title: "Seniority Levels",
    description: "Experience levels in your network",
    component: "PieChart",
    data: SENIORITY_DATA,
  }
];

const AnimatedPieChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={1500}
          label={({
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            value,
            index
          }) => {
            const RADIAN = Math.PI / 180;
            const radius = 25 + innerRadius + (outerRadius - innerRadius);
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
              <text
                x={x}
                y={y}
                fill="#888"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-xs"
              >
                {`${data[index].name} (${value})`}
              </text>
            );
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Legend 
          verticalAlign="bottom" 
          height={36}
          content={({ payload }) => (
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {payload.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const AnimatedBarChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const NetworkAnalytics = () => {
  const [currentChart, setCurrentChart] = useState(0);

  const nextChart = () => {
    setCurrentChart((prev) => (prev + 1) % CHARTS.length);
  };

  const prevChart = () => {
    setCurrentChart((prev) => (prev - 1 + CHARTS.length) % CHARTS.length);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{CHARTS[currentChart].title}</CardTitle>
            <CardDescription>{CHARTS[currentChart].description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevChart}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextChart}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          key={currentChart}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          {CHARTS[currentChart].component === "PieChart" ? (
            <AnimatedPieChart data={CHARTS[currentChart].data} />
          ) : (
            <AnimatedBarChart data={CHARTS[currentChart].data} />
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const demoData = [
    { name: "Posts", views: 4000 },
    { name: "Comments", views: 2400 },
    { name: "Shares", views: 1800 }
  ];

  return (
    <div className="relative space-y-24 pb-0">
      <HeroSection
        title="Personal LinkedIn analytics made simple."
        subtitle={{
          regular: "Unlock Your LinkedIn Potential ",
          gradient: "with AI-Powered Insights",
        }}
        description="Boost your LinkedIn presence with personalized recommendations and deep activity analysis. Optimize your LinkedIn strategy today! 🚀"
        ctaText="Get Started"
        ctaHref="/dashboard"
        bottomImage={{
          light: "/dashboard.png",
          dark: "/dashboard.png",
        }}
        gridOptions={{
          angle: 65,
          opacity: 0.4,
          cellSize: 50,
          lightLineColor: "#4a4a4a",
          darkLineColor: "#2a2a2a",
        }}
      />

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">Key Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to optimize your LinkedIn presence and grow your professional network
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader>
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-12">
          <NetworkAnalytics />

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Get personalized profile optimization tips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Optimize your headline for better visibility",
                "Add relevant skills to match job requirements",
                "Improve your about section with keywords"].map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      

      {/* Pricing Section
      <section className="container mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">Simple Pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that best fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PRICING_TIERS.map((tier) => (
            <Card 
              key={tier.name}
              className={`backdrop-blur-sm ${
                tier.highlighted 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card/50"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className={tier.highlighted ? "text-primary-foreground/80" : ""}>
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{feature}</span>
                  </div>
                ))}
                <Button 
                  className={`w-full mt-6  ${
                    tier.highlighted ? "bg-white text-black hover:bg-gray-200" : "bg-gray-300 text-white"
                  }`}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}

{/* Footer Section */}
<footer className="bg-card/50 backdrop-blur-sm border-t border-muted mt-24">
  <div className="container mx-auto px-4 py-16">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Contact Form */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">Get in Touch</h3>
        <Card className="bg-card/50 backdrop-blur-sm border-muted">
          <CardContent className="pt-6">
            <form className="space-y-4" action="https://formspree.io/f/mpwpzqvv" method="POST">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="How can I help you?"
                />
              </div>
              <Button type="submit" className="w-full flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Social Links & Info */}
      <div className="flex flex-col justify-between">
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-6">Connect With Me</h3>
            <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <a
                    href="https://www.linkedin.com/in/bradley-juma"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <span>LinkedIn Profile</span>
                  </a>
                  <a
                    href="mailto:info@ordinise.co.ke"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span>info@ordinise.co.ke</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-3">
                  <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
                  <a href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Dashboard</a>
                  
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-muted">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} <span className="font-semibold">Ordinise</span>. All rights reserved.
            </div>
           
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}
