import { motion } from "framer-motion";
import { TrendingUp, Copy, Users, DollarSign, Gift } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stats = [
  { label: "Total Referrals", value: "24", icon: Users },
  { label: "Earnings", value: "₹2,400", icon: DollarSign },
  { label: "Pending", value: "₹600", icon: Gift },
  { label: "Conversion Rate", value: "12%", icon: TrendingUp },
];

const Affiliate = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Affiliate Program</h1>
              <p className="text-sm text-muted-foreground">Earn by sharing</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Referral Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Referral Link</CardTitle>
              <CardDescription>Share this link to earn rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value="https://untitled.app/ref/user123" readOnly className="flex-1" />
                <Button className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn ₹100 for every successful referral who subscribes to a paid plan.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { step: 1, title: "Share Your Link", desc: "Send your unique referral link to friends" },
                  { step: 2, title: "They Sign Up", desc: "Your friend creates an account and subscribes" },
                  { step: 3, title: "You Earn", desc: "Get ₹100 credited to your wallet" },
                ].map((item) => (
                  <div key={item.step} className="text-center p-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold text-primary">{item.step}</span>
                    </div>
                    <h3 className="font-medium mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Affiliate;
