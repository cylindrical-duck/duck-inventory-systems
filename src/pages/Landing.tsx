import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, TrendingUp, Shield, Zap, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <img
                  src="/logos/logo-stack-3.png"
                  alt="Stackable Logo"
                  className="h-full w-full object-cover"
                />              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Stackable</h1>
                <p className="text-sm text-muted-foreground">CPG Inventory Management</p>
              </div>
            </div>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Stop Wrestling with Excel Spreadsheets
          </h2>
          <p className="text-xl text-muted-foreground">
            CPG companies lose thousands of hours managing inventory in Excel.
            Stackable gives you real-time visibility, automated tracking, and
            seamless order management—all in one powerful platform.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-8">
              The Excel Problem for CPG Companies
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <h4 className="text-xl font-semibold mb-2 text-destructive">Manual Updates</h4>
                  <p className="text-muted-foreground">
                    Constantly updating quantities, chasing team members for data,
                    and dealing with version control chaos.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <h4 className="text-xl font-semibold mb-2 text-destructive">No Real-Time Visibility</h4>
                  <p className="text-muted-foreground">
                    Never knowing actual stock levels until it's too late.
                    Stockouts and overordering cost you money.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <h4 className="text-xl font-semibold mb-2 text-destructive">Error-Prone</h4>
                  <p className="text-muted-foreground">
                    One wrong formula or deleted cell can corrupt your entire inventory.
                    Human errors compound over time.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <h4 className="text-xl font-semibold mb-2 text-destructive">Difficult Scaling</h4>
                  <p className="text-muted-foreground">
                    As your product lines grow, Excel becomes unmanageable.
                    Multiple sheets, broken links, and slow performance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">
              Built for CPG Companies
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Dual Inventory Tracking</h4>
                  <p className="text-muted-foreground">
                    Track both raw materials and finished products in one place.
                    Perfect for cookie makers, olive oil producers, and all CPG businesses.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Smart Reorder Alerts</h4>
                  <p className="text-muted-foreground">
                    Automatic low-stock notifications ensure you never run out of
                    critical ingredients or packaging materials.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Order Management</h4>
                  <p className="text-muted-foreground">
                    Integrated order tracking that automatically updates your inventory.
                    Know exactly what's committed and what's available.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Real-Time Updates</h4>
                  <p className="text-muted-foreground">
                    Everyone on your team sees the same data instantly.
                    No more emailing spreadsheets back and forth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to Leave Excel Behind?
            </h3>
            <p className="text-xl text-muted-foreground">
              Join leading CPG companies who've made the switch to smarter inventory management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Setup in minutes</span>
              </div>
            </div>
            <Button size="lg" onClick={() => navigate("/auth")} className="mt-6">
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Stackable. Built for CPG companies that demand better.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
