import { useEffect } from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import { UserMinus } from 'lucide-react'

interface UserSelectorProps {
  selectedUserId?: string
  onSelect: (userId: string | undefined) => void
  label?: string
  placeholder?: string
}

export default function UserSelector({ selectedUserId, onSelect, label, placeholder = 'Select user...' }: UserSelectorProps) {
  const { users, fetchUsers } = useUserStore()

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers()
    }
  }, [])

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-slate-400">{label}</label>}

      <Select
        value={selectedUserId || 'unassigned'}
        onValueChange={(value) => onSelect(value === 'unassigned' ? undefined : value)}
      >
        <SelectTrigger className="w-full h-10 bg-slate-900/50 border-slate-700 text-white focus:ring-cyan-500">
          <div className="flex items-center gap-2 w-full">
            {selectedUser ? (
              <>
                <Avatar className="w-6 h-6 border border-slate-600">
                  {selectedUser.avatar && <img src={selectedUser.avatar} alt={selectedUser.firstName} className="w-full h-full object-cover" />}
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-[10px] font-bold">
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedUser.firstName} {selectedUser.lastName}</span>
              </>
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[300px]">
          <SelectGroup>
            <SelectItem value="unassigned" className="focus:bg-slate-800 focus:text-white cursor-pointer">
              <div className="flex items-center gap-2 text-slate-400">
                <UserMinus className="w-4 h-4" />
                <span>Unassigned</span>
              </div>
            </SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id} className="focus:bg-slate-800 focus:text-white cursor-pointer">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6 border border-slate-600/50">
                    {user.avatar && <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />}
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-bold">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.firstName} {user.lastName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
