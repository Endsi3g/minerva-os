import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="p-8 text-silver">
        <p>Todo list — Supabase not configured.</p>
      </div>
    );
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: todos } = await supabase.from('todos').select();
    return (
      <ul className="p-8 text-ivory">
        {todos?.map((todo: any) => (
          <li key={todo.id} className="list-disc ml-4">{todo.name}</li>
        ))}
      </ul>
    );
  } catch {
    return (
      <div className="p-8 text-silver">
        <p>Todo list — unable to load.</p>
      </div>
    );
  }
}
