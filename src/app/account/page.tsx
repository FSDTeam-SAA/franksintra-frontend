'use client'

import * as React from 'react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import {
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
  MapPin,
  AtSign,
  LogOut,
  NotebookPen,
  Phone,
  CalendarDays,
  UsersRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

import { AppHeader } from '@/components/gbp/AppHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  changePassword,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
  logout,
} from '@/lib/auth'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function AccountPage() {
  const { data: session } = useSession()
  const accessToken = session?.accessToken ?? ''

  // Profile fields state
  const [name, setName] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [dob, setDob] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [gender, setGender] = React.useState('male')
  const [bio, setBio] = React.useState('')
  const [language, setLanguage] = React.useState('en')
  const [country, setCountry] = React.useState('')
  const [cityState, setCityState] = React.useState('')
  const [roadArea, setRoadArea] = React.useState('')
  const [postalCode, setPostalCode] = React.useState('')
  const [taxId, setTaxId] = React.useState('')

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)

  // Password fields state
  const [oldPassword, setOldPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  // Password visibility toggles
  const [showOldPassword, setShowOldPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // Loading/submitting states
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const profileQuery = useQuery({
    queryKey: ['me', accessToken],
    queryFn: () => getCurrentUserProfile(accessToken),
    enabled: Boolean(accessToken),
  })

  const profile = profileQuery.data

  // Sync profile data to state once loaded
  React.useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setUsername(profile.username ?? '')
      setDob(
        profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
      )
      setPhone(profile.phone ?? '')
      setGender(profile.gender ?? 'male')
      setBio(profile.bio ?? '')
      setLanguage(profile.language ?? 'en')
      setCountry(profile.address?.country ?? '')
      setCityState(profile.address?.cityState ?? '')
      setRoadArea(profile.address?.roadArea ?? '')
      setPostalCode(profile.address?.postalCode ?? '')
      setTaxId(profile.address?.taxId ?? '')
      // Set avatar preview from existing profile image
      if (profile.profileImage) setAvatarPreview(profile.profileImage)
    }
  }, [profile])

  const handleUpdateProfile = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setIsUpdatingProfile(true)
    try {
      await updateCurrentUserProfile(accessToken, {
        name,
        username,
        dob: dob || undefined,
        phone,
        gender: gender as 'male' | 'female' | 'other',
        bio,
        language,
        country,
        cityState,
        roadArea,
        postalCode,
        taxId,
      })
      toast.success('Profile updated successfully')
      profileQuery.refetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not update profile',
      )
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(accessToken, { oldPassword, newPassword })
      toast.success('Password changed successfully')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not change password',
      )
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)

    setIsUploadingAvatar(true)
    try {
      // Use PUT if profile already has an image, POST otherwise
      if (profile?.profileImage) {
        await updateAvatar(accessToken, file)
      } else {
        await uploadAvatar(accessToken, file)
      }
      toast.success('Profile photo updated')
      profileQuery.refetch()
    } catch {
      toast.error('Could not upload image')
      setAvatarPreview(profile?.profileImage ?? null)
    } finally {
      setIsUploadingAvatar(false)
      // Reset input so the same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      await deleteAvatar(accessToken)
      setAvatarPreview(null)
      toast.success('Profile photo removed')
      profileQuery.refetch()
    } catch {
      toast.error('Could not remove photo')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      if (session?.accessToken) {
        await logout(session.accessToken)
      }
    } catch {
      toast.error('Could not log out from the backend, continuing locally.')
    } finally {
      setIsLogoutOpen(false)
      setIsLoggingOut(false)
      await signOut({ callbackUrl: '/login' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[15px] text-slate-900 md:text-base">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-6">
        <div className="grid items-start gap-6 grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left Column: Profile & Address Details */}
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)]">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4285F4]/10 text-[#4285F4]">
                  <UserRound className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-2xl">
                  Profile Settings
                </CardTitle>
                <CardDescription className="max-w-xl text-sm leading-6 sm:text-[15px]">
                  Keep your personal details, gender, and language preference
                  updated.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {/* ── Avatar Upload ── */}
                <div className="mb-6 flex items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="relative shrink-0">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#4285F4] to-[#2563eb] flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white">
                        {name ? name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      Profile Photo
                    </p>
                    <p className="text-xs text-slate-500">
                      JPG, PNG or WEBP · Max 5 MB
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#4285F4] bg-white px-3 py-1.5 text-xs font-semibold text-[#4285F4] shadow-sm transition hover:bg-[#4285F4] hover:text-white disabled:opacity-50"
                      >
                        <UserRound className="h-3.5 w-3.5" />
                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-500 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                {profileQuery.isLoading ? (
                  <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading profile...
                    </div>
                  </div>
                ) : profileQuery.isError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    Could not load profile details.
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                        >
                          <UserRound className="h-4 w-4 text-slate-400" /> Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          className="rounded-xl border-slate-200 focus:border-[#4285F4] focus:ring-[#4285F4]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="username"
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                        >
                          <AtSign className="h-4 w-4 text-slate-400" /> Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          className="rounded-xl border-slate-200 focus:border-[#4285F4] focus:ring-[#4285F4]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="dob"
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                        >
                          <CalendarDays className="h-4 w-4 text-slate-400" />{' '}
                          Date of Birth
                        </Label>
                        <Input
                          id="dob"
                          type="date"
                          value={dob}
                          onChange={e => setDob(e.target.value)}
                          className="rounded-xl border-slate-200 focus:border-[#4285F4] focus:ring-[#4285F4]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                        >
                          <Phone className="h-4 w-4 text-slate-400" /> Phone
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="rounded-xl border-slate-200 focus:border-[#4285F4] focus:ring-[#4285F4]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="gender"
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                        >
                          <UsersRound className="h-4 w-4 text-slate-400" />{' '}
                          Gender
                        </Label>
                        <select
                          id="gender"
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="bio"
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                      >
                        <NotebookPen className="h-4 w-4 text-slate-400" /> Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Write something about yourself..."
                        rows={3}
                        className="rounded-xl border-slate-200 focus:border-[#4285F4] focus:ring-[#4285F4]"
                      />
                    </div>

                    {/* Address Section nested in the Profile form */}
                    <div className="border-t border-slate-100 pt-5 mt-6">
                      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
                        <MapPin className="h-5 w-5 text-[#4285F4]" /> Address
                        Details
                      </h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="roadArea"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Road / Area
                          </Label>
                          <Input
                            id="roadArea"
                            type="text"
                            value={roadArea}
                            onChange={e => setRoadArea(e.target.value)}
                            className="rounded-xl border-slate-200"
                            placeholder="e.g. 123 Main St"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="cityState"
                            className="text-sm font-semibold text-slate-700"
                          >
                            City / State
                          </Label>
                          <Input
                            id="cityState"
                            type="text"
                            value={cityState}
                            onChange={e => setCityState(e.target.value)}
                            className="rounded-xl border-slate-200"
                            placeholder="e.g. Dhaka"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="postalCode"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Postal Code
                          </Label>
                          <Input
                            id="postalCode"
                            type="text"
                            value={postalCode}
                            onChange={e => setPostalCode(e.target.value)}
                            className="rounded-xl border-slate-200"
                            placeholder="e.g. 1207"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="country"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Country
                          </Label>
                          <Input
                            id="country"
                            type="text"
                            value={country}
                            onChange={e => setCountry(e.target.value)}
                            className="rounded-xl border-slate-200"
                            placeholder="e.g. Bangladesh"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full mt-4 rounded-xl bg-[#4285F4] py-5 text-base hover:bg-[#3777dd]"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                          Saving...
                        </>
                      ) : (
                        'Save Profile Details'
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Account Info, Change Password & Logout */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-lg font-bold text-slate-800">
                  Account Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Your registration information and fast actions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-3">
                    {profile?.profileImage ? (
                      <Image
                        src={profile.profileImage}
                        alt="Profile avatar"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white font-bold">
                        {name ? name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">
                        {profile?.name ?? session?.user?.name ?? 'Loading...'}
                      </p>
                      <p className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 w-fit mt-0.5">
                        {profile?.role ?? session?.user?.role ?? 'USER'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </span>
                      <span className="font-medium text-slate-900 break-all max-w-[170px] text-right">
                        {profile?.email ?? session?.user?.email ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsLogoutOpen(true)}
                  className="w-full rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2 border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" /> Log out Account
                </Button>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4285F4]/10 text-[#4285F4]">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-xl">Change Password</CardTitle>
                <CardDescription className="text-sm">
                  Update the account password below.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form className="space-y-4" onSubmit={handleChangePassword}>
                  <div className="space-y-1">
                    <Label htmlFor="oldPassword">Current password</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={event => setOldPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(v => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 transition-colors"
                        tabIndex={-1}
                        aria-label={
                          showOldPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showOldPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newPassword">New password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={event => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(v => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 transition-colors"
                        tabIndex={-1}
                        aria-label={
                          showNewPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword">
                      Confirm new password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={event =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        required
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 transition-colors"
                        tabIndex={-1}
                        aria-label={
                          showConfirmPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-[#4285F4] hover:bg-[#3777dd] text-white py-5 text-sm"
                    disabled={isChangingPassword || !accessToken}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                        Saving...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <LogOut className="h-5 w-5 text-rose-500" /> Confirm Log Out
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-2">
              Are you sure you want to log out from your account? You will need
              to log back in to manage your website workspace or edit settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsLogoutOpen(false)}
              className="rounded-xl px-4 py-2 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />{' '}
                  Logging out...
                </>
              ) : (
                'Yes, Log out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
