import { AppHeader } from "@/components/gbp/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = [
  { id: 1, text: "Weekend brunch offer with eco packaging", /* date: "May 24, 2026", */ /* status: "Scheduled" */ },
  { id: 2, text: "Seasonal launch post with local SEO keywords", /* date: "May 20, 2026", */ /* status: "Published" */ },
  { id: 3, text: "Cafe ambience photo spotlight", /* date: "May 18, 2026", */ /* status: "Draft" */ },
];

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-[15px] text-slate-900 md:text-base">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader><CardTitle className="text-lg">Generated Post History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-xl border bg-white p-4 transition-all duration-300 hover:shadow-sm">
                <p className="font-medium text-slate-900">{row.text}</p>
                <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
                  {/* <span>{row.date}</span>
                  <Badge variant="secondary">{row.status}</Badge> */}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
