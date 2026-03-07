'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, UserCheck, UserX, Clock } from 'lucide-react'
import Link from 'next/link'

interface UserResult {
  id: string
  name: string
  email: string
  followStatus: 'none' | 'pending' | 'accepted' | 'rejected'
}

interface FollowRequest {
  id: string
  from_user: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any
}

export default function SocialPage() {
  const [myId, setMyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<FollowRequest[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function loadSocial() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyId(user.id)

      // Followers (people who follow me, accepted)
      const { data: followerRows } = await supabase
        .from('follow_requests')
        .select('id, from_user, users!follow_requests_from_user_fkey(name, email)')
        .eq('to_user', user.id)
        .eq('status', 'accepted')
      setFollowers(followerRows ?? [])

      // Following (people I follow, accepted)
      const { data: followingRows } = await supabase
        .from('follow_requests')
        .select('id, to_user, users!follow_requests_to_user_fkey(name, email)')
        .eq('from_user', user.id)
        .eq('status', 'accepted')
      setFollowing(followingRows ?? [])

      // Pending requests I received
      const { data: pendingRows } = await supabase
        .from('follow_requests')
        .select('id, from_user, users!follow_requests_from_user_fkey(name, email)')
        .eq('to_user', user.id)
        .eq('status', 'pending')
      setPendingRequests(pendingRows ?? [])
    }
    loadSocial()
  }, [])

  async function handleSearch() {
    if (!searchQuery.trim() || !myId) return
    setSearching(true)
    const supabase = createClient()

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .ilike('name', `%${searchQuery}%`)
      .eq('privacy_settings.profile_searchable', true)
      .neq('id', myId)
      .limit(10)

    const { data: myRequests } = await supabase
      .from('follow_requests')
      .select('to_user, status')
      .eq('from_user', myId)

    const requestMap = new Map((myRequests ?? []).map((r: any) => [r.to_user, r.status]))

    setSearchResults(
      (users ?? []).map((u: any) => ({
        ...u,
        followStatus: requestMap.get(u.id) ?? 'none',
      }))
    )
    setSearching(false)
  }

  async function sendFollowRequest(toUserId: string) {
    const supabase = createClient()
    await supabase.from('follow_requests').insert({ from_user: myId, to_user: toUserId })
    setSearchResults(prev =>
      prev.map(u => u.id === toUserId ? { ...u, followStatus: 'pending' } : u)
    )
  }

  async function respondToRequest(requestId: string, status: 'accepted' | 'rejected') {
    const supabase = createClient()
    await supabase.from('follow_requests').update({ status }).eq('id', requestId)
    setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    if (status === 'accepted') {
      // Refresh followers
      const req = pendingRequests.find(r => r.id === requestId)
      if (req) setFollowers(prev => [...prev, req])
    }
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Social</h1>

      <Tabs defaultValue="search">
        <TabsList className="w-full">
          <TabsTrigger value="search" className="flex-1">Find People</TabsTrigger>
          <TabsTrigger value="following" className="flex-1">
            Following {following.length > 0 && `(${following.length})`}
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex-1">
            Followers {followers.length > 0 && `(${followers.length})`}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching} size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {searchResults.map(user => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {user.followStatus === 'none' && (
                    <Button size="sm" onClick={() => sendFollowRequest(user.id)}>Follow</Button>
                  )}
                  {user.followStatus === 'pending' && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                  {user.followStatus === 'accepted' && (
                    <Link href={`/social/${user.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="following" className="space-y-2 mt-4">
          {following.length === 0 ? (
            <p className="text-sm text-muted-foreground">You're not following anyone yet.</p>
          ) : (
            following.map((f: any) => (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials(f.users?.name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{f.users?.name}</p>
                  </div>
                  <Link href={`/social/${f.to_user}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="followers" className="space-y-2 mt-4">
          {followers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No followers yet.</p>
          ) : (
            followers.map((f: any) => (
              <Card key={f.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials(f.users?.name ?? '?')}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{f.users?.name}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-2 mt-4">
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            pendingRequests.map(req => (
              <Card key={req.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials(req.users?.name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{req.users?.name} wants to follow you</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respondToRequest(req.id, 'accepted')} className="gap-1">
                      <UserCheck className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respondToRequest(req.id, 'rejected')} className="gap-1">
                      <UserX className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
