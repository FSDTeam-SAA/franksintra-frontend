import { AppHeader } from '@/components/gbp/AppHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-[15px] text-slate-900 md:text-base">
      <AppHeader />
      <main className="container mx-auto max-w-7xl px-4 py-6 md:px-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Workspace Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="business">Business name</Label>
              <Input id="business" defaultValue="Frank's Bistro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Primary location keyword</Label>
              <Input id="location" defaultValue="Downtown Dhaka" />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-medium">Auto-save drafts</p>
                <p className="text-sm text-slate-600">
                  Save generated content instantly
                </p>
              </div>
              <Checkbox defaultChecked />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
