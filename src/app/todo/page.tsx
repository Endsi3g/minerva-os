import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul className="p-8 text-ivory">
      {todos?.map((todo: any) => (
        <li key={todo.id} className="list-disc ml-4">{todo.name}</li>
      ))}
    </ul>
  )
}
