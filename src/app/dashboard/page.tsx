import { CalendarDays, FileText, ImageUp, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/gbp/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-[15px] text-slate-900 md:text-base">
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader><CardTitle className="text-lg">Drafts</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between"><span>12 active drafts</span><FileText className="h-5 w-5 text-[#4285F4]" /></CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader><CardTitle className="text-lg">Scheduled</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between"><span>8 upcoming posts</span><CalendarDays className="h-5 w-5 text-[#4285F4]" /></CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader><CardTitle className="text-lg">AI Credits</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between"><span>246 remaining</span><Sparkles className="h-5 w-5 text-[#4285F4]" /></CardContent>
          </Card>
        </div>
        <Card className="rounded-xl shadow-sm">
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <Button className="rounded-xl bg-[#4285F4] hover:bg-[#3777dd]">
              <ImageUp className="mr-2 h-4 w-4" /> Create a new GBP post
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
